import { Response } from 'express';
import { ChatService } from '../services/ChatService';
import { SendMessageData } from '../types/chat.types';
import { ApiResponse } from '../types/api.types';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class ChatController {
  constructor(private chatService: ChatService) {}

  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const senderId = req.user!.userId;
    const messageData: SendMessageData = req.body;
    
    if (!messageData.receiverId || !messageData.content) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID and content are required',
        message: 'Missing required fields'
      });
    }

    const result = await this.chatService.sendMessage(senderId, messageData);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Message sent successfully'
    };

    res.status(201).json(response);
  });

  getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { otherUserId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Other user ID is required',
        message: 'Missing user ID'
      });
    }

    const result = await this.chatService.getMessages(userId, otherUserId, limit, offset);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Messages retrieved successfully'
    };

    res.status(200).json(response);
  });

  getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    const conversations = await this.chatService.getConversations(userId);
    
    const response: ApiResponse = {
      success: true,
      data: { conversations },
      message: 'Conversations retrieved successfully'
    };

    res.status(200).json(response);
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { otherUserId } = req.params;
    
    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Other user ID is required',
        message: 'Missing user ID'
      });
    }

    await this.chatService.markConversationAsRead(userId, otherUserId);
    
    const response: ApiResponse = {
      success: true,
      message: 'Conversation marked as read'
    };

    res.status(200).json(response);
  });

  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    const unreadCount = await this.chatService.getUnreadCount(userId);
    
    const response: ApiResponse = {
      success: true,
      data: { unreadCount },
      message: 'Unread count retrieved successfully'
    };

    res.status(200).json(response);
  });

  updateOnlineStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { online } = req.body;
    
    if (typeof online !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Online status must be a boolean',
        message: 'Invalid online status'
      });
    }

    const user = await this.chatService.updateUserOnlineStatus(userId, online);
    
    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'Online status updated successfully'
    };

    res.status(200).json(response);
  });

  getUsersWithLastMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const currentUserId = req.user!.userId;
    
    const users = await this.chatService.getUsersWithLastMessage(currentUserId);
    
    const response: ApiResponse = {
      success: true,
      data: { users },
      message: 'Users with last message retrieved successfully'
    };

    res.status(200).json(response);
  });
}