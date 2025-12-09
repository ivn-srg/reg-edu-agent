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

// Интерфейсы для conversations
export interface ConversationListItem {
  id: number;
  user_id: string;
  title: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationsListResponse {
  conversations: ConversationListItem[];
  total: number;
}

export interface ConversationResponse {
  id: number;
  user_id: string;
  title: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface MessageResponse {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  timestamp: string;
}

export interface ConversationExport {
  conversation: ConversationResponse;
  messages: MessageResponse[];
}

export interface ConversationCreateRequest {
  user_id: string;
  title: string;
  conversation_type: string;
}

export interface MessageCreateRequest {
  role: string;
  content: string;
}

export interface ConversationListParams {
  skip?: number;
  limit?: number;
  search?: string;
  conversation_type?: string;
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
      const errorText = await response.text();
      console.error(`API error ${response.status}:`, errorText);
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    } else {
      // Если ответ не JSON, возвращаем пустой массив для списков или null для объектов
      if (endpoint.includes('/messages')) {
        return [] as T;
      }
      throw new Error('Invalid response format: expected JSON');
    }
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

  // Методы для conversations
  async createConversation(data: ConversationCreateRequest): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserConversations(
    userId: string,
    params: ConversationListParams = {}
  ): Promise<ConversationsListResponse> {
    const queryParams = new URLSearchParams();
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.conversation_type) queryParams.append('conversation_type', params.conversation_type);

    const queryString = queryParams.toString();
    const url = `/users/${userId}/conversations${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ConversationsListResponse>(url, {
      method: 'GET',
    });
  }

  async getConversation(conversationId: number): Promise<ConversationResponse> {
    return this.request<ConversationResponse>(`/conversations/${conversationId}`, {
      method: 'GET',
    });
  }

  async deleteConversation(conversationId: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async addMessage(
    conversationId: number,
    data: MessageCreateRequest
  ): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversationMessages(conversationId: number): Promise<MessageResponse[]> {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}:`, errorText);
        return [];
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        return [];
      }

      const messages = await response.json();
      console.log('Raw messages response:', messages);
      console.log('Messages is array:', Array.isArray(messages));
      
      // Убеждаемся, что возвращается массив
      if (Array.isArray(messages)) {
        return messages;
      } else {
        console.error('Messages is not an array:', messages);
        return [];
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      // Возвращаем пустой массив при ошибке
      return [];
    }
  }

  async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<ConversationResponse> {
    return this.request<ConversationResponse>(`/conversations/${conversationId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async exportConversation(conversationId: number): Promise<ConversationExport> {
    return this.request<ConversationExport>(`/conversations/${conversationId}/export`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

