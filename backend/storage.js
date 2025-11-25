const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');

let db = { conversations: {}, unread: {} };

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, JSON.stringify({ conversations: {} }, null, 2));
}

function load() {
  ensureFile();
  try {
    const text = fs.readFileSync(MSG_FILE, 'utf8');
    db = JSON.parse(text || '{"conversations":{}, "unread":{}}');
    if (!db.conversations) db.conversations = {};
    if (!db.unread) db.unread = {};
  } catch {
    db = { conversations: {}, unread: {} };
  }
}

function save() {
  try {
    fs.writeFileSync(MSG_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('保存消息失败:', e.message || e);
  }
}

function keyFor(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function appendMessage(from, to, content, timestamp) {
  const key = keyFor(from, to);
  if (!db.conversations[key]) db.conversations[key] = [];
  const msg = { from, to, content, timestamp: timestamp || Date.now() };
  db.conversations[key].push(msg);
  // 保持按时间排序
  db.conversations[key].sort((x, y) => x.timestamp - y.timestamp);
  // 简单限流：每个会话最多保留最近5000条
  if (db.conversations[key].length > 5000) {
    db.conversations[key] = db.conversations[key].slice(-5000);
  }
  if (!db.unread[to]) db.unread[to] = {};
  db.unread[to][from] = (db.unread[to][from] || 0) + 1;
  save();
  return msg;
}

function getMessages(userA, userB, beforeTs, limit = 20) {
  const key = keyFor(userA, userB);
  const list = db.conversations[key] || [];
  if (!beforeTs) {
    const slice = list.slice(-limit);
    return { messages: slice, nextCursor: slice.length ? slice[0].timestamp : null };
  }
  const idx = list.findIndex(m => m.timestamp >= beforeTs);
  const end = idx === -1 ? list.length : idx; // 取 strictly older (< beforeTs)
  const start = Math.max(0, end - limit);
  const slice = list.slice(start, end);
  return { messages: slice, nextCursor: slice.length ? slice[0].timestamp : null };
}

function getUnreadByPeer(userId) {
  return { ...(db.unread[userId] || {}) };
}

function getTotalUnread(userId) {
  const map = db.unread[userId] || {};
  return Object.values(map).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

function resetUnread(userId, peerId) {
  if (!db.unread[userId]) db.unread[userId] = {};
  db.unread[userId][peerId] = 0;
  save();
  return { byPeer: getUnreadByPeer(userId), total: getTotalUnread(userId) };
}

module.exports = {
  load,
  appendMessage,
  getMessages,
  getUnreadByPeer,
  getTotalUnread,
  resetUnread,
};
