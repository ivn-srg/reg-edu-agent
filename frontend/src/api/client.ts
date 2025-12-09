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
    try {
      // Убедимся, что endpoint начинается с /
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${this.baseUrl}${normalizedEndpoint}`;
      
      const finalOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };
      
      console.log(`Making ${finalOptions.method || 'GET'} request to:`, url);
      console.log('Request body:', finalOptions.body);
      console.log('Request headers:', finalOptions.headers);
      
      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status} for ${url}:`, errorText);
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      // Для ответов без контента (например, 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        // Ensure we return the data as-is, even if it's null or undefined
        return data as T;
      } else {
        console.warn('Response is not JSON, returning empty object');
        return {} as T;
      }
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
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
    console.log('Sending message to conversation:', conversationId, data);
    return this.request<MessageResponse>('/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        ...data,
      }),
    });
  }

  async getConversationMessages(conversationId: number): Promise<MessageResponse[]> {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const messages = await this.request<MessageResponse[]>(`/conversations/${conversationId}/messages`, {
        method: 'GET',
      });
      console.log('Messages fetched:', messages);
      // Убеждаемся, что возвращается массив
      if (!messages) {
        console.warn('Messages response is null or undefined');
        return [];
      }
      if (!Array.isArray(messages)) {
        console.error('Expected an array of messages but got:', messages);
        return [];
      }
      
      return messages;
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
    const body = JSON.stringify({ title });
    console.log('Updating title with body:', body);
    console.log('Conversation ID:', conversationId);
    return this.request<ConversationResponse>(`/conversations/${conversationId}/title`, {
      method: 'PUT',
      body: body,
    });
  }

  async exportConversation(conversationId: number): Promise<ConversationExport> {
    return this.request<ConversationExport>(`/conversations/${conversationId}/export`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

