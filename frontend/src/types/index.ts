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
  currentConversationId: number | null;
  userId: string;
  onConversationCreated: (() => void) | null;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setCurrentType: (type: MessageType | null) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  exportDialog: () => void;
  setCurrentConversationId: (id: number | null) => void;
  createNewConversation: (type: MessageType) => Promise<number | null>;
  saveMessageToDb: (role: 'user' | 'assistant', content: string) => Promise<void>;
  loadConversation: (conversationId: number) => Promise<void>;
  setOnConversationCreated: (callback: (() => void) | null) => void;
}

