export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  clientId?: string;
  pending?: boolean;
  delivered?: boolean;
}

export interface Conversation {
  peer: string;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
}

export interface ChatState {
  messages: Record<string, Message[]>;
  conversations: Conversation[];
  activePeer: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface SendMessageData {
  to: string;
  content: string;
  clientId?: string;
}

export interface MessageResponse {
  messages: Message[];
  nextCursor: number | null;
}

export interface UnreadCounts {
  byPeer: Record<string, number>;
  total: number;
}