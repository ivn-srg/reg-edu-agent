export type MessageType = 'question' | 'quiz' | 'task';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: MessageType;
  generationTime?: number; // Time in seconds for assistant messages
}

export interface ChatState {
  messages: Message[];
  currentType: MessageType | null;
  isLoading: boolean;
  userId: string;
  currentConversationId: number | null;
  onConversationCreated: (() => void) | null;
  onMessageAdded: (() => void) | null;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setCurrentType: (type: MessageType | null) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  exportDialog: () => void;
  setUserId: (userId: string) => void;
  setCurrentConversationId: (id: number | null) => void;
  loadConversation: (conversationId: number) => Promise<void>;
  setOnConversationCreated: (callback: (() => void) | null) => void;
  setOnMessageAdded: (callback: (() => void) | null) => void;
  saveMessageToDb: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
}

