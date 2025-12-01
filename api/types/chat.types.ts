export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount1: number;
  unreadCount2: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageData {
  receiverId: string;
  content: string;
}

export interface MessageResponse {
  message: Message;
  conversation: Conversation;
}

export interface ConversationResponse {
  conversation: Conversation;
  messages: Message[];
  hasMore: boolean;
  totalCount: number;
}