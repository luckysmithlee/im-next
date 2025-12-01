import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { authenticateToken, AuthRequest } from './middlewares/auth';
import { ChatService } from './services/ChatService';
import { ChatRepository } from './repositories/ChatRepository';
import { UserRepository } from './repositories/UserRepository';
import { User } from './types/auth.types';
import { Message } from './types/chat.types';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize services
const userRepository = new UserRepository();
const chatRepository = new ChatRepository();
const chatService = new ChatService(chatRepository, userRepository);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const { JWTUtil } = await import('./utils/jwt');
    const payload = JWTUtil.verifyToken(token);
    
    // Get user data
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const user = socket.data.user as User;
  console.log(`User ${user.name} (${user.id}) connected`);

  // Join user-specific room
  socket.join(`user_${user.id}`);

  // Update user online status
  userRepository.updateOnlineStatus(user.id, true);

  // Notify other users that this user is online
  socket.broadcast.emit('user_online', {
    userId: user.id,
    online: true
  });

  // Handle private messages
  socket.on('private_message', async (data: { receiverId: string; content: string }) => {
    try {
      const { receiverId, content } = data;
      
      // Send message through chat service
      const result = await chatService.sendMessage(user.id, { receiverId, content });
      
      // Emit message to receiver
      io.to(`user_${receiverId}`).emit('new_message', {
        message: result.message,
        conversation: result.conversation
      });
      
      // Emit confirmation to sender
      socket.emit('message_sent', {
        message: result.message,
        conversation: result.conversation
      });
      
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('message_error', {
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data: { receiverId: string }) => {
    socket.to(`user_${data.receiverId}`).emit('user_typing', {
      userId: user.id,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data: { receiverId: string }) => {
    socket.to(`user_${data.receiverId}`).emit('user_typing', {
      userId: user.id,
      isTyping: false
    });
  });

  // Handle message read status
  socket.on('mark_as_read', async (data: { otherUserId: string }) => {
    try {
      await chatService.markConversationAsRead(user.id, data.otherUserId);
      
      // Notify the other user that messages have been read
      io.to(`user_${data.otherUserId}`).emit('messages_read', {
        userId: user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${user.name} (${user.id}) disconnected`);
    
    // Update user online status
    await userRepository.updateOnlineStatus(user.id, false);
    
    // Notify other users that this user is offline
    socket.broadcast.emit('user_offline', {
      userId: user.id,
      online: false,
      lastSeen: new Date()
    });
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };