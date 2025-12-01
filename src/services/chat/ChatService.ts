import type { Message, SendMessageData, Conversation } from '@/types';
import type { ISocketService } from './SocketService';
import type { ChatApi } from '@/services/api';

export interface IChatService {
  sendMessage(to: string, content: string): Promise<Message>;
  getMessages(peer: string, before?: number, limit?: number): Promise<Message[]>;
  markAsRead(peer: string): Promise<void>;
  deleteConversation(peer: string): Promise<void>;
  subscribeToMessages(callback: (message: Message) => void): () => void;
}

export class ChatService implements IChatService {
  private api: ChatApi;
  private socketService: ISocketService;
  private messageCallbacks: Set<(message: Message) => void> = new Set();

  constructor(api: ChatApi, socketService: ISocketService) {
    this.api = api;
    this.socketService = socketService;
    this.setupSocketListeners();
  }

  async sendMessage(to: string, content: string): Promise<Message> {
    const messageData: SendMessageData = {
      to,
      content,
      clientId: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };

    const pendingMessage: Message = {
      id: messageData.clientId!,
      from: '', // Will be set by server
      to,
      content,
      timestamp: Date.now(),
      clientId: messageData.clientId,
      pending: true,
    };

    this.socketService.sendMessage(messageData);
    
    return pendingMessage;
  }

  async getMessages(peer: string, before?: number, limit: number = 20): Promise<Message[]> {
    try {
      const response = await this.api.getMessages(peer, before, limit);
      return response.messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw new Error('获取消息失败');
    }
  }

  async markAsRead(peer: string): Promise<void> {
    try {
      this.socketService.markAsRead(peer);
      await this.api.markAsRead(peer);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async deleteConversation(peer: string): Promise<void> {
    try {
      await this.api.deleteConversation(peer);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw new Error('删除会话失败');
    }
  }

  subscribeToMessages(callback: (message: Message) => void): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  private setupSocketListeners(): void {
    this.socketService.onMessage((message: Message) => {
      this.notifyMessageCallbacks(message);
    });
  }

  private notifyMessageCallbacks(message: Message): void {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }
}