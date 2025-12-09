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
}

export const apiClient = new ApiClient(API_BASE_URL);

