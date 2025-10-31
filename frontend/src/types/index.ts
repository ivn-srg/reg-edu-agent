export type MessageType = 'question' | 'quiz' | 'task';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: MessageType;
}

export interface ChatState {
  messages: Message[];
  currentType: MessageType | null;
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setCurrentType: (type: MessageType | null) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  exportDialog: () => void;
}

