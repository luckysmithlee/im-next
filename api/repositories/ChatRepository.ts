import { Message, Conversation } from '../types/chat.types';

// In-memory storage for demo purposes
// In a real application, this would be a database
const messages: Message[] = [];
const conversations: Conversation[] = [];

export class ChatRepository {
  async createMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const newMessage: Message = {
      ...messageData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    messages.push(newMessage);
    return newMessage;
  }

  async findMessagesByConversation(
    participant1Id: string, 
    participant2Id: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ messages: Message[]; totalCount: number; hasMore: boolean }> {
    const conversationMessages = messages
      .filter(msg => 
        (msg.senderId === participant1Id && msg.receiverId === participant2Id) ||
        (msg.senderId === participant2Id && msg.receiverId === participant1Id)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalCount = conversationMessages.length;
    const paginatedMessages = conversationMessages.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    return {
      messages: paginatedMessages.reverse(), // Reverse to get chronological order
      totalCount,
      hasMore
    };
  }

  async findUnreadMessages(userId: string): Promise<Message[]> {
    return messages.filter(msg => 
      msg.receiverId === userId && !msg.read
    );
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<number> {
    let updatedCount = 0;
    messages.forEach(msg => {
      if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.read) {
        msg.read = true;
        updatedCount++;
      }
    });
    return updatedCount;
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    // Ensure consistent ordering of participants
    const [user1Id, user2Id] = [participant1Id, participant2Id].sort();
    
    let conversation = conversations.find(conv => 
      conv.participant1Id === user1Id && conv.participant2Id === user2Id
    );

    if (!conversation) {
      conversation = {
        id: Date.now().toString(),
        participant1Id: user1Id,
        participant2Id: user2Id,
        unreadCount1: 0,
        unreadCount2: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      conversations.push(conversation);
    }

    return conversation;
  }

  async updateConversationLastMessage(
    conversationId: string, 
    lastMessage: Message
  ): Promise<Conversation | null> {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return null;

    conversation.lastMessage = lastMessage;
    conversation.lastMessageAt = lastMessage.timestamp;
    conversation.updatedAt = new Date();

    return conversation;
  }

  async incrementUnreadCount(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return null;

    if (conversation.participant1Id === userId) {
      conversation.unreadCount2++;
    } else if (conversation.participant2Id === userId) {
      conversation.unreadCount1++;
    }

    conversation.updatedAt = new Date();
    return conversation;
  }

  async resetUnreadCount(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return null;

    if (conversation.participant1Id === userId) {
      conversation.unreadCount1 = 0;
    } else if (conversation.participant2Id === userId) {
      conversation.unreadCount2 = 0;
    }

    conversation.updatedAt = new Date();
    return conversation;
  }

  async findConversationsByUser(userId: string): Promise<Conversation[]> {
    return conversations.filter(conv => 
      conv.participant1Id === userId || conv.participant2Id === userId
    ).sort((a, b) => {
      const dateA = a.lastMessageAt || a.createdAt;
      const dateB = b.lastMessageAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }

  async findConversationByParticipants(participant1Id: string, participant2Id: string): Promise<Conversation | null> {
    const [user1Id, user2Id] = [participant1Id, participant2Id].sort();
    return conversations.find(conv => 
      conv.participant1Id === user1Id && conv.participant2Id === user2Id
    ) || null;
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return 0;

    if (conversation.participant1Id === userId) {
      return conversation.unreadCount1;
    } else if (conversation.participant2Id === userId) {
      return conversation.unreadCount2;
    }

    return 0;
  }
}