import { create } from 'zustand';
import type { ChatState, Message, MessageType } from '../types';
import { exportDialogToExcel } from '../utils/exportDialog';
import { apiClient, type MessageResponse } from '../api/client';

type Role = 'user' | 'assistant';


// Генерируем userId при первом использовании
const generateUserId = (): string => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('userId', newUserId);
  return newUserId;
};

const createChatStore = (set: any, get: any) => ({
  messages: [] as Message[],
  currentType: null as MessageType | null,
  isLoading: false,
  userId: generateUserId(),
  currentConversationId: null as number | null,
  onConversationCreated: null as (() => void) | null,
  onMessageAdded: null as (() => void) | null,
  
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    set((state: ChatState) => ({
      messages: [...state.messages, newMessage],
    }));
    // Trigger callback to update conversation list
    const callback = get().onMessageAdded;
    if (callback) {
      callback();
    }
    return newMessage;
  },
  
  setCurrentType: (type: MessageType | null) => set({ currentType: type }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  clearMessages: () => set({ messages: [], currentType: null, currentConversationId: null }),
  
  exportDialog: () => {
    exportDialogToExcel(get().messages);
  },

  setUserId: (userId: string) => {
    localStorage.setItem('userId', userId);
    set({ userId });
  },

  setCurrentConversationId: (id: number | null) => set({ currentConversationId: id }),

  loadConversation: async (conversationId: number) => {
    try {
      set({ isLoading: true });
      
      console.log('Loading conversation:', conversationId);
      // Load conversation details
      const conversation = await apiClient.getConversation(conversationId);
      console.log('Conversation loaded:', conversation);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      const conversationType = conversation.conversation_type as MessageType;
      if (!conversationType) {
        throw new Error('Conversation type is missing');
      }

      // Load messages with proper error handling
      let messagesResponse: MessageResponse[] = [];
      try {
        const response = await apiClient.getConversationMessages(conversationId);
        console.log('Raw messages response:', response);
        
        if (Array.isArray(response)) {
          messagesResponse = response;
        } else if (response === null || response === undefined) {
          console.warn('Messages response is null or undefined');
          messagesResponse = [];
        } else {
          console.warn('Messages response is not an array:', typeof response, response);
          messagesResponse = [];
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        messagesResponse = [];
      }

      console.log('Messages loaded:', messagesResponse, 'Type:', typeof messagesResponse);

      // Process messages with additional validation
      const appMessages: Message[] = [];
      if (Array.isArray(messagesResponse)) {
        for (const msg of messagesResponse) {
          try {
            appMessages.push({
              id: String(msg.id),
              content: String(msg.content || ''),
              role: msg.role as Role,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              type: conversationType,
            });
          } catch (e) {
            console.error('Error processing message:', msg, e);
          }
        }
      }
      
      console.log('App messages processed:', appMessages);
      
      const newState = {
        messages: appMessages,
        currentType: conversationType,
        currentConversationId: conversationId,
        isLoading: false,
      };
      
      console.log('Setting state:', newState);
      try {
        set(newState);
        console.log('State set successfully');
      } catch (setError) {
        console.error('Error setting state:', setError);
        throw setError;
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      set({ isLoading: false, messages: [], currentConversationId: null });
      throw new Error(
        `Failed to load conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

// In chatStore.ts
  saveMessageToDb: async (message: Omit<Message, 'id' | 'timestamp'>): Promise<void> => {
    const { currentConversationId } = get();
    if (!currentConversationId) {
      throw new Error('No active conversation to save message to');
    }

    try {
      await apiClient.addMessage(currentConversationId, {
        role: message.role,
        content: message.content,
      });
    } catch (error) {
      console.error('Failed to save message:', error);
      throw new Error(
        `Failed to save message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  setOnConversationCreated: (callback: (() => void) | null) => {
    set({ onConversationCreated: callback });
  },
  setOnMessageAdded: (callback: (() => void) | null) => {
    set({ onMessageAdded: callback });
  },
});

// Create the store without persistence - we'll load from server instead
export const useChatStore = create<ChatState>()(
  (set, get) => ({
    ...createChatStore(set, get),
  })
);

