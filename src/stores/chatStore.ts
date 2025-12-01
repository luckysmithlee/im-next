import type { ChatState, Message, Conversation } from '@/types';
import type { IChatService } from '@/services/chat/ChatService';
import type { ISocketService } from '@/services/chat/SocketService';

export class ChatStore {
  private state: ChatState = {
    messages: {},
    conversations: [],
    activePeer: null,
    isLoading: false,
    error: null,
  };

  private listeners: Set<(state: ChatState) => void> = new Set();
  private messageSubscriptions: Map<string, Set<(messages: Message[]) => void>> = new Map();

  constructor(
    private chatService: IChatService,
    private socketService: ISocketService
  ) {
    this.setupSocketListeners();
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.state.activePeer) {
      throw new Error('No active peer selected');
    }

    try {
      const message = await this.chatService.sendMessage(
        this.state.activePeer,
        content
      );

      this.updateMessages(this.state.activePeer, (messages) => 
        [...messages, message]
      );
    } catch (error) {
      this.setState({
        ...this.state,
        error: error instanceof Error ? error.message : '发送消息失败',
      });
      throw error;
    }
  }

  async loadMessages(peer: string, before?: number): Promise<Message[]> {
    this.setState({
      ...this.state,
      isLoading: true,
      error: null,
    });

    try {
      const messages = await this.chatService.getMessages(peer, before);
      
      if (before) {
        this.updateMessages(peer, (existing) => [...messages, ...existing]);
      } else {
        this.updateMessages(peer, () => messages);
      }
      
      return messages;
    } catch (error) {
      this.setState({
        ...this.state,
        error: error instanceof Error ? error.message : '加载消息失败',
      });
      throw error;
    } finally {
      this.setState({
        ...this.state,
        isLoading: false,
      });
    }
  }

  setActivePeer(peer: string | null): void {
    this.setState({
      ...this.state,
      activePeer: peer,
    });

    if (peer) {
      this.markAsRead(peer);
    }
  }

  async markAsRead(peer: string): Promise<void> {
    try {
      await this.chatService.markAsRead(peer);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async deleteConversation(peer: string): Promise<void> {
    try {
      await this.chatService.deleteConversation(peer);
      
      const newMessages = { ...this.state.messages };
      delete newMessages[peer];
      
      const newConversations = this.state.conversations.filter(
        (c) => c.peer !== peer
      );
      
      this.setState({
        ...this.state,
        messages: newMessages,
        conversations: newConversations,
        activePeer: this.state.activePeer === peer ? null : this.state.activePeer,
      });
    } catch (error) {
      this.setState({
        ...this.state,
        error: error instanceof Error ? error.message : '删除会话失败',
      });
      throw error;
    }
  }

  updateConversations(conversations: Conversation[]): void {
    this.setState({
      ...this.state,
      conversations,
    });
  }

  getMessages(peer: string): Message[] {
    return this.state.messages[peer] || [];
  }

  getState(): ChatState {
    return this.state;
  }

  subscribe(listener: (state: ChatState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToMessages(peer: string, callback: (messages: Message[]) => void): () => void {
    if (!this.messageSubscriptions.has(peer)) {
      this.messageSubscriptions.set(peer, new Set());
    }
    
    const callbacks = this.messageSubscriptions.get(peer)!;
    callbacks.add(callback);
    
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.messageSubscriptions.delete(peer);
      }
    };
  }

  private setupSocketListeners(): void {
    this.chatService.subscribeToMessages((message: Message) => {
      const peer = message.from === this.state.activePeer ? message.from : message.to;
      if (peer) {
        this.updateMessages(peer, (messages) => {
          const existingIndex = messages.findIndex(m => m.clientId === message.clientId);
          if (existingIndex >= 0) {
            const updated = [...messages];
            updated[existingIndex] = message;
            return updated;
          }
          return [...messages, message];
        });
      }
    });
  }

  private updateMessages(peer: string, updater: (messages: Message[]) => Message[]): void {
    const currentMessages = this.state.messages[peer] || [];
    const newMessages = updater(currentMessages);
    
    this.setState({
      ...this.state,
      messages: {
        ...this.state.messages,
        [peer]: newMessages,
      },
    });

    const callbacks = this.messageSubscriptions.get(peer);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newMessages);
        } catch (error) {
          console.error('Error in message subscription callback:', error);
        }
      });
    }
  }

  private setState(newState: ChatState): void {
    this.state = newState;
    this.listeners.forEach(listener => listener(this.state));
  }
}