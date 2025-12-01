import { Message, Conversation, SendMessageData, MessageResponse, ConversationResponse } from '../types/chat.types';
import { User } from '../types/auth.types';
import { ChatRepository } from '../repositories/ChatRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../middlewares/errorHandler';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private userRepository: UserRepository
  ) {}

  async sendMessage(senderId: string, messageData: SendMessageData): Promise<MessageResponse> {
    const { receiverId, content } = messageData;

    // Validate sender and receiver
    const [sender, receiver] = await Promise.all([
      this.userRepository.findById(senderId),
      this.userRepository.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      throw new AppError('Sender or receiver not found', 404);
    }

    if (senderId === receiverId) {
      throw new AppError('Cannot send message to yourself', 400);
    }

    // Create message
    const message = await this.chatRepository.createMessage({
      content: content.trim(),
      senderId,
      receiverId,
      timestamp: new Date(),
      read: false
    });

    // Get or create conversation
    const conversation = await this.chatRepository.getOrCreateConversation(senderId, receiverId);

    // Update conversation last message
    await this.chatRepository.updateConversationLastMessage(conversation.id, message);

    // Increment unread count for receiver
    await this.chatRepository.incrementUnreadCount(conversation.id, senderId);

    return {
      message,
      conversation
    };
  }

  async getMessages(
    userId: string, 
    otherUserId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ConversationResponse> {
    // Validate users
    const [user, otherUser] = await Promise.all([
      this.userRepository.findById(userId),
      this.userRepository.findById(otherUserId)
    ]);

    if (!user || !otherUser) {
      throw new AppError('User not found', 404);
    }

    // Get conversation
    const conversation = await this.chatRepository.findConversationByParticipants(userId, otherUserId);
    if (!conversation) {
      return {
        conversation: await this.chatRepository.getOrCreateConversation(userId, otherUserId),
        messages: [],
        hasMore: false,
        totalCount: 0
      };
    }

    // Get messages
    const { messages, totalCount, hasMore } = await this.chatRepository.findMessagesByConversation(
      userId,
      otherUserId,
      limit,
      offset
    );

    // Mark messages as read
    await this.chatRepository.markMessagesAsRead(otherUserId, userId);

    // Reset unread count for this conversation
    await this.chatRepository.resetUnreadCount(conversation.id, userId);

    return {
      conversation,
      messages,
      hasMore,
      totalCount
    };
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // Validate user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.chatRepository.findConversationsByUser(userId);
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    // Validate users
    const [user, otherUser] = await Promise.all([
      this.userRepository.findById(userId),
      this.userRepository.findById(otherUserId)
    ]);

    if (!user || !otherUser) {
      throw new AppError('User not found', 404);
    }

    // Get conversation
    const conversation = await this.chatRepository.findConversationByParticipants(userId, otherUserId);
    if (!conversation) return;

    // Mark messages as read
    await this.chatRepository.markMessagesAsRead(otherUserId, userId);

    // Reset unread count
    await this.chatRepository.resetUnreadCount(conversation.id, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Validate user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const conversations = await this.chatRepository.findConversationsByUser(userId);
    
    return conversations.reduce((total, conversation) => {
      if (conversation.participant1Id === userId) {
        return total + conversation.unreadCount1;
      } else if (conversation.participant2Id === userId) {
        return total + conversation.unreadCount2;
      }
      return total;
    }, 0);
  }

  async updateUserOnlineStatus(userId: string, online: boolean): Promise<User | null> {
    return this.userRepository.updateOnlineStatus(userId, online);
  }

  async getUsersWithLastMessage(currentUserId: string): Promise<User[]> {
    const users = await this.userRepository.findAllExcept(currentUserId);
    const conversations = await this.chatRepository.findConversationsByUser(currentUserId);

    // Enhance users with last message data
    const enhancedUsers = users.map(user => {
      const conversation = conversations.find(conv => 
        (conv.participant1Id === currentUserId && conv.participant2Id === user.id) ||
        (conv.participant1Id === user.id && conv.participant2Id === currentUserId)
      );

      return {
        ...user,
        lastMessage: conversation?.lastMessage?.content || '',
        lastMessageTime: conversation?.lastMessageAt || null,
        unreadCount: conversation ? 
          (conversation.participant1Id === currentUserId ? conversation.unreadCount1 : conversation.unreadCount2) : 0
      };
    });

    // Sort by last message time
    return enhancedUsers.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }
}