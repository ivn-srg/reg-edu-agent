import { create } from 'zustand';
import type { ChatState, Message } from '../types';
import { exportDialogToExcel } from '../utils/exportDialog';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentType: null,
  isLoading: false,
  
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
  
  clearMessages: () => set({ messages: [], currentType: null }),
  
  exportDialog: () => {
    const state = useChatStore.getState();
    exportDialogToExcel(state.messages);
  },
}));

