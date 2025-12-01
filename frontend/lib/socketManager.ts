import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { getBackendBase } from './api';

type Handlers = {
  onOnline?: (list: string[]) => void;
  onMessage?: (msg: any) => void;
  onUnread?: (payload: any) => void;
  onDisconnect?: (reason: any) => void;
  onConnectError?: (err: any) => void;
};

export class SocketManager {
  token: string;
  socket: Socket | null = null;
  handlers: Handlers;
  constructor(token: string, handlers: Handlers = {}) {
    this.token = token;
    this.handlers = handlers;
  }
  connect() {
    this.socket = io(getBackendBase(), {
      auth: { token: this.token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 8000,
      transports: ['websocket', 'polling'],
    });
    const lastErrRef = { t: 0 } as any;
    this.socket.on('disconnect', (reason) => {
      this.handlers.onDisconnect && this.handlers.onDisconnect(reason);
    });
    this.socket.on('connect_error', (err) => {
      const now = Date.now();
      if (now - (lastErrRef.t || 0) > 5000) {
        this.handlers.onConnectError && this.handlers.onConnectError(err);
        lastErrRef.t = now;
      }
    });
    this.socket.on('online_users', (list) => this.handlers.onOnline && this.handlers.onOnline(list));
    this.socket.on('private_message', (msg) => this.handlers.onMessage && this.handlers.onMessage(msg));
    this.socket.on('unread_counts', (payload) => this.handlers.onUnread && this.handlers.onUnread(payload));
  }
  disconnect() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
  }
  markRead(peer: string) {
    if (!this.socket) return;
    this.socket.emit('mark_read', { peer });
  }
  send(to: string, content: string, clientId?: string) {
    if (!this.socket) return;
    this.socket.emit('private_message', { to, content, clientId });
  }
}
