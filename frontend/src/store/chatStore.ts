import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatState, Message } from '../types';
import { exportDialogToExcel } from '../utils/exportDialog';
import { apiClient } from '../api/client';

// Генерация уникального ID пользователя
const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentType: null,
      isLoading: false,
      currentConversationId: null,
      userId: getUserId(),
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
        const state = get();
        exportDialogToExcel(state.messages);
      },

      // Conversation management
      setCurrentConversationId: (id) => set({ currentConversationId: id }),

      createNewConversation: async (type) => {
        const state = get();
        const title = `Новый диалог ${new Date().toLocaleString('ru-RU')}`;
        
        try {
          const conversation = await apiClient.createConversation({
            user_id: state.userId,
            title,
            conversation_type: type,
          });
          
          set({ 
            currentConversationId: conversation.id,
            currentType: type,
            messages: [],
          });
          
          // Вызываем callback для обновления списка
          if (state.onConversationCreated) {
            state.onConversationCreated();
          }
          
          return conversation.id;
        } catch (error) {
          console.error('Failed to create conversation:', error);
          return null;
        }
      },

      setOnConversationCreated: (callback) => set({ onConversationCreated: callback }),

      saveMessageToDb: async (role, content) => {
        const state = get();
        if (!state.currentConversationId) return;

        try {
          await apiClient.addMessage({
            conversation_id: state.currentConversationId,
            role,
            content,
          });
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      },

      loadConversation: async (conversationId) => {
        try {
          const conversation = await apiClient.getConversation(conversationId);
          
          const messages: Message[] = conversation.messages.map((msg) => ({
            id: msg.id.toString(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            type: conversation.conversation_type as any,
          }));

          set({
            currentConversationId: conversation.id,
            currentType: conversation.conversation_type as any,
            messages,
          });
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        userId: state.userId,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);

