import type { Message, SendMessageData } from '@/types';
import { getBackendBase, SOCKET_EVENTS, generateClientId } from '@/utils';
import { io, Socket } from 'socket.io-client';

export interface ISocketService {
  connect(token: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  onMessage(callback: (message: Message) => void): void;
  onOnlineUsers(callback: (users: string[]) => void): void;
  onUnreadCounts(callback: (counts: { byPeer: Record<string, number>; total: number }) => void): void;
  onConnect(callback: () => void): void;
  onDisconnect(callback: (reason: string) => void): void;
  onConnectError(callback: (error: any) => void): void;
  sendMessage(data: SendMessageData): void;
  markAsRead(peer: string): void;
}

export class SocketService implements ISocketService {
  private socket: Socket | null = null;
  private token: string = '';
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.setupEventHandlers();
  }

  async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.socket = io(getBackendBase(), {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 8000,
      transports: ['websocket', 'polling'],
    });

    this.setupSocketListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  onMessage(callback: (message: Message) => void): void {
    this.addEventListener(SOCKET_EVENTS.PRIVATE_MESSAGE, callback);
  }

  onOnlineUsers(callback: (users: string[]) => void): void {
    this.addEventListener(SOCKET_EVENTS.ONLINE_USERS, callback);
  }

  onUnreadCounts(callback: (counts: { byPeer: Record<string, number>; total: number }) => void): void {
    this.addEventListener(SOCKET_EVENTS.UNREAD_COUNTS, callback);
  }

  onConnect(callback: () => void): void {
    this.addEventListener(SOCKET_EVENTS.CONNECTION, callback);
  }

  onDisconnect(callback: (reason: string) => void): void {
    this.addEventListener(SOCKET_EVENTS.DISCONNECT, callback);
  }

  onConnectError(callback: (error: any) => void): void {
    this.addEventListener(SOCKET_EVENTS.CONNECT_ERROR, callback);
  }

  sendMessage(data: SendMessageData): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    const messageData = {
      ...data,
      clientId: data.clientId || generateClientId(),
    };

    this.socket.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, messageData);
  }

  markAsRead(peer: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit(SOCKET_EVENTS.MARK_READ, { peer });
  }

  private setupEventHandlers(): void {
    this.eventHandlers.set(SOCKET_EVENTS.PRIVATE_MESSAGE, new Set());
    this.eventHandlers.set(SOCKET_EVENTS.ONLINE_USERS, new Set());
    this.eventHandlers.set(SOCKET_EVENTS.UNREAD_COUNTS, new Set());
    this.eventHandlers.set(SOCKET_EVENTS.CONNECTION, new Set());
    this.eventHandlers.set(SOCKET_EVENTS.DISCONNECT, new Set());
    this.eventHandlers.set(SOCKET_EVENTS.CONNECT_ERROR, new Set());
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.emitEvent(SOCKET_EVENTS.CONNECTION);
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.emitEvent(SOCKET_EVENTS.DISCONNECT, reason);
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: any) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.emitEvent(SOCKET_EVENTS.CONNECT_ERROR, error);
    });

    this.socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, (message: Message) => {
      this.emitEvent(SOCKET_EVENTS.PRIVATE_MESSAGE, message);
    });

    this.socket.on(SOCKET_EVENTS.ONLINE_USERS, (users: string[]) => {
      this.emitEvent(SOCKET_EVENTS.ONLINE_USERS, users);
    });

    this.socket.on(SOCKET_EVENTS.UNREAD_COUNTS, (counts: { byPeer: Record<string, number>; total: number }) => {
      this.emitEvent(SOCKET_EVENTS.UNREAD_COUNTS, counts);
    });
  }

  private addEventListener(event: string, callback: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(callback);
    }
  }

  private emitEvent(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }
}