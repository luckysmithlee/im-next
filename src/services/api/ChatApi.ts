import type { Message, MessageResponse, UnreadCounts } from '@/types';
import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from '@/utils';

export class ChatApi {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async getMessages(peer: string, before?: number, limit: number = 20): Promise<MessageResponse> {
    const params: Record<string, any> = { limit };
    if (before) {
      params.before = before;
    }
    
    return this.httpClient.get<MessageResponse>(`${API_ENDPOINTS.CHAT.MESSAGES}/${peer}`, params);
  }

  async getConversations(): Promise<{ conversations: any[] }> {
    return this.httpClient.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
  }

  async markAsRead(peer: string): Promise<{ byPeer: Record<string, number>; total: number }> {
    return this.httpClient.post(`${API_ENDPOINTS.CHAT.READ}/${peer}`);
  }

  async getUnread(): Promise<UnreadCounts> {
    return this.httpClient.get(API_ENDPOINTS.CHAT.UNREAD);
  }

  async deleteConversation(peer: string): Promise<void> {
    return this.httpClient.delete(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${peer}`);
  }
}