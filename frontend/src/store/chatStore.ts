import { create } from 'zustand';
import type { ChatState, Message, MessageType } from '../types';
import { exportDialogToExcel } from '../utils/exportDialog';
import { apiClient } from '../api/client';

// Генерируем userId при первом использовании
const generateUserId = (): string => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('userId', newUserId);
  return newUserId;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentType: null,
  isLoading: false,
  userId: generateUserId(),
  currentConversationId: null,
  onConversationCreated: null,
  
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },
  
  setCurrentType: (type) => set({ currentType: type }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  clearMessages: () => set({ messages: [], currentType: null, currentConversationId: null }),
  
  exportDialog: () => {
    const state = useChatStore.getState();
    exportDialogToExcel(state.messages);
  },

  setUserId: (userId: string) => {
    localStorage.setItem('userId', userId);
    set({ userId });
  },

  setCurrentConversationId: (id: number | null) => set({ currentConversationId: id }),

  loadConversation: async (conversationId: number) => {
    try {
      console.log('Loading conversation:', conversationId);
      
      // Загружаем conversation и messages отдельно для лучшей обработки ошибок
      let conversation;
      let messages: any[] = [];
      
      try {
        conversation = await apiClient.getConversation(conversationId);
        console.log('Conversation loaded:', conversation);
        
        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
        throw new Error(`Не удалось загрузить диалог: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }

      // Инициализируем messages как пустой массив
      messages = [];
      
      try {
        const messagesResponse = await apiClient.getConversationMessages(conversationId);
        console.log('Messages received:', messagesResponse);
        console.log('Messages type:', typeof messagesResponse);
        console.log('Is array:', Array.isArray(messagesResponse));
        
        // Проверяем, что messagesResponse является массивом
        if (messagesResponse && Array.isArray(messagesResponse)) {
          messages = [...messagesResponse]; // Создаем копию массива
        } else {
          console.warn('Messages is not an array or is undefined, using empty array. Received:', messagesResponse);
          messages = [];
        }
      } catch (error) {
        console.error('Failed to load messages, using empty array:', error);
        messages = [];
      }

      // Финальная проверка - гарантируем, что messages это массив
      if (!Array.isArray(messages)) {
        console.error('CRITICAL: Messages is still not an array after all checks:', messages, typeof messages);
        messages = [];
      }

      console.log('Before map - messages:', messages, 'is array:', Array.isArray(messages), 'length:', messages.length);

      // Преобразуем сообщения из API в формат приложения
      // Используем messages напрямую, так как мы гарантировали, что это массив
      const appMessages: Message[] = messages.map((msg: any) => {
        if (!msg || typeof msg !== 'object' || !msg.id || !msg.content || !msg.role) {
          console.error('Invalid message format:', msg);
          return null;
        }
        try {
          return {
            id: String(msg.id),
            content: String(msg.content),
            role: msg.role as 'user' | 'assistant',
            timestamp: new Date(msg.timestamp || Date.now()),
            type: conversation.conversation_type as MessageType,
          };
        } catch (error) {
          console.error('Error processing message:', error, msg);
          return null;
        }
      }).filter((msg): msg is Message => msg !== null);

      console.log('App messages:', appMessages);

      set({
        messages: appMessages,
        currentType: conversation.conversation_type as MessageType,
        currentConversationId: conversationId,
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  },

  setOnConversationCreated: (callback: (() => void) | null) => {
    set({ onConversationCreated: callback });
  },
}));

