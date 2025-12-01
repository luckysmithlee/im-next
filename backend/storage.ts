import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, 'data');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');

type Message = { from: string; to: string; content: string; timestamp: number; clientId?: string };
type SessionInfo = { lastActive?: number; lastRead?: number };
type DB = {
  conversations: Record<string, Message[]>;
  unread: Record<string, Record<string, number>>;
  session: Record<string, Record<string, SessionInfo>>;
};

let db: DB = { conversations: {}, unread: {}, session: {} };

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, JSON.stringify({ conversations: {} }, null, 2));
}

export function load() {
  ensureFile();
  try {
    const text = fs.readFileSync(MSG_FILE, 'utf8');
    const parsed = JSON.parse(text || '{"conversations":{}, "unread":{}, "session":{}}');
    db.conversations = parsed.conversations || {};
    db.unread = parsed.unread || {};
    db.session = parsed.session || {};
  } catch {
    db = { conversations: {}, unread: {}, session: {} };
  }
}

function save() {
  try {
    fs.writeFileSync(MSG_FILE, JSON.stringify(db, null, 2));
  } catch (e: any) {
    console.error('保存消息失败:', e.message || e);
  }
}

function keyFor(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function appendMessage(from: string, to: string, content: string, timestamp?: number, extra?: Partial<Message>) {
  const key = keyFor(from, to);
  if (!db.conversations[key]) db.conversations[key] = [];
  const msg: Message = { from, to, content, timestamp: timestamp || Date.now(), ...(extra || {}) };
  db.conversations[key].push(msg);
  db.conversations[key].sort((x, y) => x.timestamp - y.timestamp);
  if (db.conversations[key].length > 5000) {
    db.conversations[key] = db.conversations[key].slice(-5000);
  }
  if (!db.unread[to]) db.unread[to] = {};
  db.unread[to][from] = (db.unread[to][from] || 0) + 1;
  save();
  return msg;
}

export function getMessages(userA: string, userB: string, beforeTs?: number, limit = 20) {
  const key = keyFor(userA, userB);
  const list = db.conversations[key] || [];
  if (!beforeTs) {
    const slice = list.slice(-limit);
    return { messages: slice, nextCursor: slice.length ? slice[0].timestamp : null };
  }
  const idx = list.findIndex(m => m.timestamp >= beforeTs);
  const end = idx === -1 ? list.length : idx;
  const start = Math.max(0, end - limit);
  const slice = list.slice(start, end);
  return { messages: slice, nextCursor: slice.length ? slice[0].timestamp : null };
}

export function getUnreadByPeer(userId: string) {
  return { ...(db.unread[userId] || {}) } as Record<string, number>;
}

export function getTotalUnread(userId: string) {
  const map = db.unread[userId] || {};
  return Object.values(map).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function resetUnread(userId: string, peerId: string) {
  if (!db.unread[userId]) db.unread[userId] = {};
  db.unread[userId][peerId] = 0;
  if (!db.session[userId]) db.session[userId] = {};
  if (!db.session[userId][peerId]) db.session[userId][peerId] = {};
  db.session[userId][peerId].lastRead = Date.now();
  save();
  return { byPeer: getUnreadByPeer(userId), total: getTotalUnread(userId) };
}

export function setLastActive(userId: string, peerId: string) {
  if (!db.session[userId]) db.session[userId] = {};
  if (!db.session[userId][peerId]) db.session[userId][peerId] = {};
  db.session[userId][peerId].lastActive = Date.now();
  save();
}

export function getSession(userId: string) {
  return { ...(db.session[userId] || {}) } as Record<string, SessionInfo>;
}

export function listPeers(userId: string) {
  const res: Array<{ peer: string; lastTs: number; unread: number; lastActive: number; lastRead: number }> = [];
  for (const key of Object.keys(db.conversations)) {
    const parts = key.split('|');
    if (!parts.includes(userId)) continue;
    const peer = parts[0] === userId ? parts[1] : parts[0];
    const list = db.conversations[key] || [];
    const lastTs = list.length ? list[list.length - 1].timestamp : 0;
    const unread = (db.unread[userId] && db.unread[userId][peer]) || 0;
    const sess = (db.session[userId] && db.session[userId][peer]) || {};
    res.push({ peer, lastTs, unread, lastActive: sess.lastActive || 0, lastRead: sess.lastRead || 0 });
  }
  res.sort((a, b) => (b.lastActive || b.lastTs) - (a.lastActive || a.lastTs));
  return res;
}

export function deleteConversation(userA: string, userB: string) {
  const key = keyFor(userA, userB);
  db.conversations[key] = [];
  if (db.unread[userA]) delete db.unread[userA][userB];
  save();
  return true;
}
