const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskRequest {
  question: string;
  k?: number;
  history?: MessageHistory[];
}

export interface AskResponse {
  question: string;
  answer: string;
}

export interface QuizRequest {
  topic: string;
  num?: number;
  history?: MessageHistory[];
}

export interface QuizResponse {
  topic: string;
  questions: string;
}

export interface TaskRequest {
  topic: string;
  history?: MessageHistory[];
}

export interface TaskResponse {
  topic: string;
  task: string;
}

export interface ConversationCreate {
  user_id: string;
  title: string;
  conversation_type: 'question' | 'quiz' | 'task';
}

export interface MessageData {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationData {
  id: number;
  user_id: string;
  title: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  messages: MessageData[];
}

export interface ConversationListItem {
  id: number;
  user_id: string;
  title: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface MessageCreate {
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async ask(data: AskRequest): Promise<AskResponse> {
    return this.request<AskResponse>('/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async quiz(data: QuizRequest): Promise<QuizResponse> {
    return this.request<QuizResponse>('/quiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async task(data: TaskRequest): Promise<TaskResponse> {
    return this.request<TaskResponse>('/task', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Conversation history methods
  async createConversation(data: ConversationCreate): Promise<ConversationData> {
    return this.request<ConversationData>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversation(conversationId: number): Promise<ConversationData> {
    return this.request<ConversationData>(`/conversations/${conversationId}`, {
      method: 'GET',
    });
  }

  async getUserConversations(
    userId: string,
    params?: {
      skip?: number;
      limit?: number;
      search?: string;
      conversation_type?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<{ conversations: ConversationListItem[]; total: number; skip: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.conversation_type) queryParams.append('conversation_type', params.conversation_type);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const queryString = queryParams.toString();
    const url = `/users/${userId}/conversations${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ conversations: ConversationListItem[]; total: number; skip: number; limit: number }>(url, {
      method: 'GET',
    });
  }

  async deleteConversation(conversationId: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async addMessage(data: MessageCreate): Promise<MessageData> {
    return this.request<MessageData>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversationMessages(conversationId: number): Promise<MessageData[]> {
    return this.request<MessageData[]>(`/conversations/${conversationId}/messages`, {
      method: 'GET',
    });
  }

  async updateConversationTitle(conversationId: number, title: string): Promise<{ status: string; title: string }> {
    return this.request<{ status: string; title: string }>(`/conversations/${conversationId}/title?title=${encodeURIComponent(title)}`, {
      method: 'PUT',
    });
  }

  async exportConversation(conversationId: number): Promise<any> {
    return this.request<any>(`/conversations/${conversationId}/export`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

