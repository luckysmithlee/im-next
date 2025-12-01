export async function fetchJSON(url: string, options: RequestInit = {}, retry = 2, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    if (!resp.ok) throw new Error(String(resp.status));
    const data = await resp.json();
    return data;
  } catch (e) {
    if (retry > 0) return fetchJSON(url, options, retry - 1, timeout);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function getBackendBase() {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL as string | undefined;
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    let v = raw.trim();
    if (v.startsWith(':')) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      v = `http://${host}${v}`;
    } else if (!/^https?:\/\//.test(v)) {
      v = `http://${v}`;
    }
    return v;
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:4000`;
}

export class ChatApi {
  token: string;
  constructor(token: string) { this.token = token; }
  headers(): HeadersInit { return { Authorization: `Bearer ${this.token}` }; }
  base(): string { return getBackendBase(); }
  async searchUsers(q: string, page = 1, pageSize = 8) {
    const url = new URL(`${this.base()}/api/users/search`);
    url.searchParams.set('q', q);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));
    return fetchJSON(url.toString(), { headers: this.headers() }, 0, 5000);
  }
  async getConversations() {
    return fetchJSON(`${this.base()}/api/conversations`, { headers: this.headers() }, 2, 6000);
  }
  async getUnread() {
    return fetchJSON(`${this.base()}/api/unread`, { headers: this.headers() }, 2, 6000);
  }
  async markRead(peer: string) {
    return fetchJSON(`${this.base()}/api/read/${peer}`, { method: 'POST', headers: this.headers() }, 1, 6000);
  }
  async getMessages(peer: string, before?: number, limit = 20) {
    const url = new URL(`${this.base()}/api/messages/${peer}`);
    if (before) url.searchParams.set('before', String(before));
    url.searchParams.set('limit', String(limit));
    return fetchJSON(url.toString(), { headers: this.headers() }, 2, 6000);
  }
  async deleteConversation(peer: string) {
    return fetch(`${this.base()}/api/conversations/${peer}`, { method: 'DELETE', headers: this.headers() });
  }
}
