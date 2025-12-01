import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { ChatService } from '../services/ChatService';
import { ChatRepository } from '../repositories/ChatRepository';
import { UserRepository } from '../repositories/UserRepository';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const userRepository = new UserRepository();
const chatRepository = new ChatRepository();
const chatService = new ChatService(chatRepository, userRepository);
const chatController = new ChatController(chatService);

// All chat routes require authentication
router.use(authenticateToken);

// Message routes
router.post('/messages', chatController.sendMessage);
router.get('/messages/:otherUserId', chatController.getMessages);

// Conversation routes
router.get('/conversations', chatController.getConversations);
router.put('/conversations/:otherUserId/read', chatController.markAsRead);

// Status routes
router.get('/unread-count', chatController.getUnreadCount);
router.put('/online-status', chatController.updateOnlineStatus);

// User routes
router.get('/users/with-last-message', chatController.getUsersWithLastMessage);

export default router;