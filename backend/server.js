const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

const GOTRUE_URL = process.env.GOTRUE_URL || 'http://localhost:9999/auth/v1';

// 简单在线用户映射: userId -> socketId
const onlineUsers = new Map();

async function verifyToken(token) {
  if (!token) return null;
  
  // 支持模拟token（用于开发环境）
  if (token.startsWith('mock_jwt_')) {
    // 从mock token中提取用户ID
    const parts = token.split('_');
    if (parts.length >= 3) {
      const userId = parts[2];
      const mockUsers = {
        'user1': { id: 'user1', email: 'test1@example.com' },
        'user2': { id: 'user2', email: 'test2@example.com' },
        'user3': { id: 'user3', email: 'test3@example.com' }
      };
      return mockUsers[userId] || null;
    }
  }
  
  // 原有的Supabase验证逻辑
  try {
    const resp = await fetch(`${GOTRUE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error('Token验证错误：', e.message || e);
    return null;
  }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  verifyToken(token).then(user => {
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  });
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const user = await verifyToken(token);
  if (!user) return next(new Error('认证失败：无效的令牌'));
  
  console.log('用户认证成功：', user.email);
  socket.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.user;
  console.log('用户已连接：', user.email, 'ID:', user.id);
  onlineUsers.set(user.id, socket.id);

  // 推送在线用户列表
  function broadcastOnline() {
    const list = Array.from(onlineUsers.keys());
    io.emit('online_users', list);
  }
  broadcastOnline();

  socket.on('private_message', (payload) => {
    // payload: { to, content }
    const toSocketId = onlineUsers.get(payload.to);
    const msg = {
      from: user.id,
      to: payload.to,
      content: payload.content,
      timestamp: Date.now()
    };
    if (toSocketId) {
      io.to(toSocketId).emit('private_message', msg);
    }
    // 给发送者回一份确认
    socket.emit('private_message', msg);
    // TODO: 持久化到 DB
  });

  socket.on('disconnect', () => {
    console.log('disconnect', user.id);
    onlineUsers.delete(user.id);
    broadcastOnline();
  });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
