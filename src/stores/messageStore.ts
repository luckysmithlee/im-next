import type { Message, UnreadCounts } from '@/types';

export class MessageStore {
  private messages: Record<string, Message[]> = {};
  private unreadCounts: UnreadCounts = {
    byPeer: {},
    total: 0,
  };
  private listeners: Set<() => void> = new Set();

  addMessage(peer: string, message: Message): void {
    if (!this.messages[peer]) {
      this.messages[peer] = [];
    }
    
    const existingIndex = this.messages[peer].findIndex(
      m => m.clientId === message.clientId
    );
    
    if (existingIndex >= 0) {
      this.messages[peer][existingIndex] = message;
    } else {
      this.messages[peer].push(message);
    }
    
    this.notifyListeners();
  }

  addMessages(peer: string, messages: Message[]): void {
    if (!this.messages[peer]) {
      this.messages[peer] = [];
    }
    
    this.messages[peer] = [...messages, ...this.messages[peer]];
    this.notifyListeners();
  }

  setMessages(peer: string, messages: Message[]): void {
    this.messages[peer] = messages;
    this.notifyListeners();
  }

  getMessages(peer: string): Message[] {
    return this.messages[peer] || [];
  }

  getAllMessages(): Record<string, Message[]> {
    return { ...this.messages };
  }

  clearMessages(peer: string): void {
    delete this.messages[peer];
    this.notifyListeners();
  }

  updateUnreadCounts(counts: UnreadCounts): void {
    this.unreadCounts = counts;
    this.notifyListeners();
  }

  getUnreadCounts(): UnreadCounts {
    return { ...this.unreadCounts };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in message store listener:', error);
      }
    });
  }
}