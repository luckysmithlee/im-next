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
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  pingTimeout: 20000,
  pingInterval: 25000,
});

const GOTRUE_URL = process.env.GOTRUE_URL || 'http://localhost:9999/auth/v1';
const storage = require('./storage');
storage.load();

// 在线用户映射: userId -> Set<socketId>
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
  if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
  onlineUsers.get(user.id).add(socket.id);

  // 推送在线用户列表
  function broadcastOnline() {
    const list = Array.from(onlineUsers.keys());
    io.emit('online_users', list);
  }
  broadcastOnline();

  try {
    const byPeer = storage.getUnreadByPeer(user.id);
    const total = storage.getTotalUnread(user.id);
    io.to(socket.id).emit('unread_counts', { byPeer, total });
  } catch (e) {
    console.error('发送初始未读计数失败', e.message || e);
  }

  socket.on('private_message', (payload) => {
    const toSockets = onlineUsers.get(payload.to);
    const msg = {
      from: user.id,
      to: payload.to,
      content: payload.content,
      timestamp: Date.now(),
      clientId: payload.clientId || undefined
    };
    storage.appendMessage(user.id, payload.to, payload.content, msg.timestamp, { clientId: msg.clientId });
    if (toSockets && toSockets.size > 0) {
      for (const sid of toSockets) {
        io.to(sid).emit('private_message', msg);
        const byPeer = storage.getUnreadByPeer(payload.to);
        const total = storage.getTotalUnread(payload.to);
        io.to(sid).emit('unread_counts', { byPeer, total });
      }
    }
    io.to(socket.id).emit('private_message', msg);
  });

  socket.on('mark_read', (payload) => {
    const peer = payload && payload.peer;
    if (!peer) return;
    const result = storage.resetUnread(user.id, peer);
    io.to(socket.id).emit('unread_counts', result);
  });

  socket.on('disconnect', () => {
    console.log('disconnect', user.id);
    const set = onlineUsers.get(user.id);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) onlineUsers.delete(user.id);
    }
    broadcastOnline();
  });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 按需分页获取历史消息
// GET /api/messages/:peer?before=<timestamp>&limit=<n>
app.get('/api/messages/:peer', authMiddleware, (req, res) => {
  const peer = req.params.peer;
  const before = req.query.before ? Number(req.query.before) : undefined;
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 20;
  const { messages, nextCursor } = storage.getMessages(req.user.id, peer, before, limit);
  res.json({ messages, nextCursor });
});

// 获取当前用户未读计数
app.get('/api/unread', authMiddleware, (req, res) => {
  const byPeer = storage.getUnreadByPeer(req.user.id);
  const total = storage.getTotalUnread(req.user.id);
  res.json({ byPeer, total });
});

app.get('/api/online-stats', authMiddleware, (req, res) => {
  const totalSockets = io.sockets.sockets.size;
  const engineClients = io.engine.clientsCount;
  const users = Array.from(onlineUsers.entries()).map(([userId, socketId]) => ({ userId, socketId }));
  res.json({ totalSockets, engineClients, onlineUsers: users });
});

app.get('/api/conversations', authMiddleware, (req, res) => {
  const list = storage.listPeers(req.user.id);
  res.json({ conversations: list });
});

// 标记与某个对端会话为已读
app.post('/api/read/:peer', authMiddleware, (req, res) => {
  const peer = req.params.peer;
  const result = storage.resetUnread(req.user.id, peer);
  const selfSocketId = onlineUsers.get(req.user.id);
  if (selfSocketId) io.to(selfSocketId).emit('unread_counts', result);
  res.json({ ok: true, ...result });
});

app.delete('/api/conversations/:peer', authMiddleware, (req, res) => {
  const peer = req.params.peer;
  storage.deleteConversation(req.user.id, peer);
  const selfSocketId = onlineUsers.get(req.user.id);
  const byPeer = storage.getUnreadByPeer(req.user.id);
  const total = storage.getTotalUnread(req.user.id);
  if (selfSocketId) io.to(selfSocketId).emit('unread_counts', { byPeer, total });
  res.json({ ok: true });
});

// 可选：通过HTTP写入一条消息（用于测试/回放）
app.post('/api/messages/:peer', authMiddleware, (req, res) => {
  const peer = req.params.peer;
  const { content, timestamp } = req.body || {};
  if (!content || typeof content !== 'string') return res.status(400).json({ error: 'content required' });
  const msg = storage.appendMessage(req.user.id, peer, content, timestamp);
  res.json({ ok: true, message: msg });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
