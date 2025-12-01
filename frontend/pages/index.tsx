import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import LoginForm from '../components/LoginForm';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { Menu, X, Users, MessageCircle, Send, UserCircle, Pin } from 'lucide-react';
import SearchBox from '../components/SearchBox';
import UnifiedSidebar from '../components/UnifiedSidebar';

let socket: Socket | null;

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [cursors, setCursors] = useState<Record<string, number | null>>({});
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [unreadByPeer, setUnreadByPeer] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<Record<string, boolean>>({});
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const tailTsRef = useRef(0);
  const scrollTimerRef = useRef<any>(null);
  const lastActionRef = useRef<string | null>(null);
  const scrollThrottleRef = useRef(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [collapseHistory, setCollapseHistory] = useState(false);
  const [collapseOnline, setCollapseOnline] = useState(false);
  const [stableOnline, setStableOnline] = useState<string[]>([]);
  const onlineUpdateTimerRef = useRef<any>(null);
  const onlineList = useMemo(() => stableOnline.filter(u => u !== userId), [stableOnline, userId]);
  const historyList = useMemo(() => conversations, [conversations]);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  const [sidebarScrollTop, setSidebarScrollTop] = useState(0);
  const ROW_HEIGHT = 60;
  const [confirmDeletePeer, setConfirmDeletePeer] = useState<string | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const unreadUpdateTimerRef = useRef<any>(null);
  const activePeerRef = useRef('');
  const connErrTimerRef = useRef<any>(null);
  const connErrPersistRef = useRef({ since: 0, count: 0 });
  const convTotal = conversations.length;
  const visibleCount = sidebarHeight ? Math.ceil(sidebarHeight / ROW_HEIGHT) + 6 : 20;
  const startIndex = Math.max(0, Math.floor(sidebarScrollTop / ROW_HEIGHT) - 3);
  const endIndex = Math.min(convTotal, startIndex + visibleCount);
  const convSlice = useMemo(() => conversations.slice(startIndex, endIndex), [conversations, startIndex, endIndex]);

  async function fetchJSON(url: string, options: RequestInit = {}, retry = 2, timeout = 6000) {
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

  function getBackendBase() {
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
  function getBffBase() {
    return '/api/bff';
  }

  function scrollToBottom() {
    const el = chatBodyRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }


  useEffect(() => {
    const savedToken = localStorage.getItem('chat_token');
    const savedUserId = localStorage.getItem('chat_userId');
    const savedUserEmail = localStorage.getItem('chat_userEmail');
    const rememberMe = localStorage.getItem('chat_remember_me') === 'true';
    if (savedToken && savedUserId && savedUserEmail) {
      const tokenParts = savedToken.split('_');
      const tokenTimestamp = tokenParts[tokenParts.length - 1];
      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const maxTokenAge = 7 * 24 * 60 * 60 * 1000;
      if (tokenAge < maxTokenAge) {
        handleLogin(savedToken, savedUserId, savedUserEmail, rememberMe);
      } else {
        localStorage.removeItem('chat_token');
        localStorage.removeItem('chat_userId');
        localStorage.removeItem('chat_userEmail');
        if (!rememberMe) {
          localStorage.removeItem('chat_remember_me');
          localStorage.removeItem('chat_saved_email');
        }
        console.log('自动登录失败：Token已过期');
      }
    }
    setIsLoading(false);
  }, []);

  function handleLogout() {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_userId');
    localStorage.removeItem('chat_userEmail');
    const rememberMe = localStorage.getItem('chat_remember_me') === 'true';
    if (!rememberMe) {
      localStorage.removeItem('chat_remember_me');
      localStorage.removeItem('chat_saved_email');
    }
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    setToken(null);
    setUserId(null);
    setUserEmail('');
    setMessages({});
    setTo('');
    setText('');
  }

  function handleLogin(tkn: string, uid: string, email: string, rememberMe = false) {
    setToken(tkn);
    setUserId(uid);
    setUserEmail(email);
    localStorage.setItem('chat_token', tkn);
    localStorage.setItem('chat_userId', uid);
    localStorage.setItem('chat_userEmail', email);
    if (rememberMe) {
      localStorage.setItem('chat_remember_me', 'true');
      localStorage.setItem('chat_saved_email', email);
    }
    socket = io(getBackendBase(), {
      auth: { token: tkn },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 8000,
      transports: ['websocket', 'polling'],
    }) as unknown as Socket;
    const lastErrRef = { t: 0 };
    socket.on('connect', () => {
      if (connErrTimerRef.current) clearTimeout(connErrTimerRef.current);
      connErrPersistRef.current = { since: 0, count: 0 };
    });
    socket.on('disconnect', (reason: any) => {
      if (connErrTimerRef.current) clearTimeout(connErrTimerRef.current);
      if (connErrPersistRef.current.since === 0) connErrPersistRef.current.since = Date.now();
      connErrPersistRef.current.count += 1;
      connErrTimerRef.current = setTimeout(() => {
        if (!socket || !socket.connected) {
          const elapsed = Date.now() - connErrPersistRef.current.since;
          if (elapsed > 10000) {
            const now = Date.now();
            if (now - lastErrRef.t > 5000) {
              console.error('Socket.IO连接失败：', reason);
              lastErrRef.t = now;
            }
          } else {
            console.warn('Socket.IO连接暂时断开：', reason);
          }
        }
      }, 2000);
    });
    socket.on('connect_error', (err: any) => {
      if (connErrTimerRef.current) clearTimeout(connErrTimerRef.current);
      if (connErrPersistRef.current.since === 0) connErrPersistRef.current.since = Date.now();
      connErrPersistRef.current.count += 1;
      connErrTimerRef.current = setTimeout(() => {
        const elapsed = Date.now() - connErrPersistRef.current.since;
        const msg = err?.message || err;
        if (elapsed > 10000) {
          const now = Date.now();
          if (now - lastErrRef.t > 5000) {
            console.error('Socket.IO连接失败：', msg);
            lastErrRef.t = now;
          }
        } else {
          console.warn('Socket.IO连接暂时不可用：', msg);
        }
      }, 2000);
    });
    socket.on('private_message', (msg: any) => {
      setMessages(prev => {
        const fromUser = msg.from === uid ? msg.to : msg.from;
        const list = prev[fromUser] || [];
        if (msg.clientId) {
          const idx = list.findIndex((m: any) => m.clientId === msg.clientId);
          if (idx >= 0) {
            const next = [...list];
            next[idx] = msg;
            return { ...prev, [fromUser]: next };
          }
        }
        return { ...prev, [fromUser]: [...list, msg] };
      });
      if (msg.from !== uid && to !== msg.from) {
        setUnreadByPeer(prev => ({
          ...prev,
          [msg.from]: (prev[msg.from] || 0) + 1,
        }));
        setTotalUnread(prev => prev + 1);
      }
      setConversations(prev => {
        const peer = msg.from === uid ? msg.to : msg.from;
        const next = [...prev];
        const idx = next.findIndex((c: any) => c.peer === peer);
        if (idx >= 0) next[idx] = { ...next[idx], lastTs: msg.timestamp };
        else next.push({ peer, lastTs: msg.timestamp, unread: 0, lastActive: 0, lastRead: 0, pinned: false, pinnedAt: 0 });
        next.sort((a: any, b: any) => {
          if (a.pinned && b.pinned) return (b.pinnedAt || 0) - (a.pinnedAt || 0);
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return (b.lastActive || b.lastTs || 0) - (a.lastActive || a.lastTs || 0);
        });
        return next;
      });
    });
    socket.on('unread_counts', (payload: any) => {
      const byPeer = (payload && payload.byPeer) || {};
      const total = (payload && payload.total) || 0;
      if (unreadUpdateTimerRef.current) clearTimeout(unreadUpdateTimerRef.current);
      unreadUpdateTimerRef.current = setTimeout(() => {
        setUnreadByPeer(byPeer);
        setTotalUnread(total);
      }, 350);
    });
    checkHealth().then((ok) => { if (ok) fetchConversations(tkn); });
    setIsLoading(false);
  }

  async function fetchConversations(tok?: string) {
    const base = getBffBase();
    const data = await fetchJSON(`${base}/api/conversations`, { headers: { Authorization: `Bearer ${tok || token}` } } as RequestInit);
    if (!data) return;
    setConversations((data as any).conversations || []);
  }

  async function togglePin(peer: string, pinned: boolean) {
    if (!token) return;
    setConversations(prev => {
      const next = prev.map((c: any) => c.peer === peer ? { ...c, pinned: pinned, pinnedAt: pinned ? Date.now() : 0 } : c);
      next.sort((a: any, b: any) => {
        if (a.pinned && b.pinned) return (b.pinnedAt || 0) - (a.pinnedAt || 0);
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastActive || b.lastTs || 0) - (a.lastActive || a.lastTs || 0);
      });
      return next;
    });
    const base = getBffBase();
    const data = await fetchJSON(`${base}/api/conversations/${peer}/pin`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned }) } as RequestInit);
    if (!data) return;
    setConversations((data as any).conversations || []);
  }

  async function doDelete(peer: string) {
    if (!token) return;
    const base = getBffBase();
    await fetch(`${base}/api/conversations/${peer}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } } as RequestInit);
    setMessages(prev => { const next: Record<string, any[]> = { ...prev }; delete next[peer]; return next; });
    setConversations(prev => prev.filter((c: any) => c.peer !== peer));
    if (to === peer) setTo('');
    setConfirmDeletePeer(null);
  }

  async function checkHealth(retry = 5) {
    const base = getBffBase();
    const ok = await fetchJSON(`${base}/health`, {}, 0, 3000);
    if (ok && (ok as any).status === 'ok') {
      setBackendReady(true);
      return true;
    }
    if (retry > 0) {
      setTimeout(() => { checkHealth(retry - 1); }, 1000);
    }
    return false;
  }

  useEffect(() => {
    if (to && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [to]);

  useEffect(() => {
    setText('');
  }, [to]);

  function send() {
    if (!socket || !to) return;
    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const msg = {
      from: userId,
      to: to,
      content: text,
      timestamp: Date.now(),
      clientId,
      pending: true,
    };
    setMessages(prev => ({
      ...prev,
      [to]: [...(prev[to] || []), msg],
    }));
    (socket as Socket).emit('private_message', { to, content: text, clientId });
    setText('');
    lastActionRef.current = 'send';
    setConversations(prev => {
      const next = [...prev];
      const idx = next.findIndex((c: any) => c.peer === to);
      if (idx >= 0) next[idx] = { ...next[idx], lastTs: msg.timestamp };
      else next.push({ peer: to, lastTs: msg.timestamp, unread: 0, lastActive: 0, lastRead: 0, pinned: false, pinnedAt: 0 });
      next.sort((a: any, b: any) => {
        if (a.pinned && b.pinned) return (b.pinnedAt || 0) - (a.pinnedAt || 0);
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastActive || b.lastTs || 0) - (a.lastActive || a.lastTs || 0);
      });
      return next;
    });
  }

  async function fetchHistory(peer: string, before?: number) {
    if (!token) return;
    const base = getBffBase();
    const url = new URL(`${base}/api/messages/${peer}`);
    if (before) url.searchParams.set('before', String(before));
    url.searchParams.set('limit', '20');
    const data = await fetchJSON(url.toString(), { headers: { Authorization: `Bearer ${token}` } } as RequestInit, 2, 6000);
    if (!data) {
      setLoadError(prev => ({ ...prev, [peer]: true }));
      return;
    }
    setLoadError(prev => ({ ...prev, [peer]: false }));
    if (!before && activePeerRef.current && activePeerRef.current !== peer) {
      return;
    }
    setMessages(prev => ({
      ...prev,
      [peer]: before ? [...(data.messages || []), ...(prev[peer] || [])] : (data.messages || []),
    }));
    setCursors(prev => ({
      ...prev,
      [peer]: data.nextCursor || null,
    }));
    return data;
  }

  useEffect(() => {
    if (to && token && backendReady) {
      activePeerRef.current = to;
      lastActionRef.current = 'init';
      fetchHistory(to).then(() => {});
      if (socket) {
        (socket as Socket).emit('mark_read', { peer: to });
      }
      const base = getBffBase();
      fetchJSON(`${base}/api/read/${to}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } } as RequestInit)
        .then((data: any) => {
          if (data && data.byPeer) {
            setUnreadByPeer(data.byPeer);
            setTotalUnread(data.total || 0);
          }
        });
    }
  }, [to, token, backendReady]);

  useEffect(() => {
    setSkipDeleteConfirm(localStorage.getItem('skip_delete_confirm') === 'true');
  }, []);
  useEffect(() => {
    function updateSize() {
      if (sidebarRef.current) setSidebarHeight(sidebarRef.current.clientHeight);
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => { window.removeEventListener('resize', updateSize); };
  }, []);

  useLayoutEffect(() => {
    const list = messages[to] || [];
    const tailTs = list.length ? list[list.length - 1].timestamp : 0;
    if (!loadingMore && tailTs > tailTsRef.current) {
      if (lastActionRef.current === 'init' || lastActionRef.current === 'send') {
        scrollToBottom();
        lastActionRef.current = null;
      }
      tailTsRef.current = tailTs;
    }
  }, [messages, to, loadingMore]);

  useEffect(() => {
    if (!token || !backendReady) return;
    const base = getBffBase();
    fetchJSON(`${base}/api/unread`, { headers: { Authorization: `Bearer ${token}` } } as RequestInit)
      .then((data: any) => {
        if (!data) return;
        if (unreadUpdateTimerRef.current) clearTimeout(unreadUpdateTimerRef.current);
        unreadUpdateTimerRef.current = setTimeout(() => {
          setUnreadByPeer(data.byPeer || {});
          setTotalUnread(data.total || 0);
        }, 350);
      });
  }, [token, backendReady]);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-900">
      {isLoading ? (
        <div className="min-h-screen bg-surface dark:bg-surface-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-muted">加载中...</p>
          </div>
        </div>
      ) : !token ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div className="h-screen flex flex-col">
          <header className="bg-primary-500 text-white px-4 py-3 text-center shadow-md">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 rounded-md hover:bg-primary-600 transition-colors flex-shrink-0"
                  aria-label="切换用户侧边栏"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold ml-4">聊天应用{totalUnread > 0 ? `（未读 ${totalUnread}）` : ''}</h1>
              </div>
              <div className="hidden lg:flex flex-1 items-center justify-center text-sm opacity-90 min-w-0 px-2 mx-2">
                <span className="hidden xl:inline truncate max-w-lg">{userEmail} (ID: {userId})</span>
                <span className="hidden lg:inline xl:hidden truncate max-w-md">{userEmail} (ID: {userId})</span>
                <span className="hidden md:inline xl:hidden truncate max-w-[200px]">{userEmail}</span>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 rounded-md transition-colors flex-shrink-0"
                  title="退出登录"
                >
                  退出
                </button>
              </div>
            </div>
            <div className="mt-3 px-2">
              <SearchBox token={token} onSelect={(id) => setTo(id)} />
            </div>
          </header>
          <div className="flex-1 flex overflow-hidden">
            <UnifiedSidebar conversations={conversations} unreadByPeer={unreadByPeer} to={to} onSelectPeer={(peer: string) => { setTo(peer); if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false); setTimeout(() => { if (messageInputRef.current) messageInputRef.current.focus(); }, 100); }} showSidebar={showSidebar} setShowSidebar={setShowSidebar} totalUnread={totalUnread} onPin={togglePin} onDelete={(peer: string) => { if (skipDeleteConfirm) { doDelete(peer); } else { setConfirmDeletePeer(peer); } }} />
            <aside className="hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-border flex-shrink-0 h-[76px] flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-text truncate">会话列表{totalUnread > 0 ? ` · 未读 ${totalUnread}` : ''}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
                    aria-label="关闭侧边栏"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-2 py-2 border-b border-border">
                  <button onClick={() => setCollapseOnline(!collapseOnline)} className="w-full flex items-center justify-between text-sm">
                    <span>在线用户</span>
                    <span>{collapseOnline ? '▶' : '▼'}</span>
                  </button>
                </div>
                {!collapseOnline && (
                  <div className="p-2 space-y-1">
                    {onlineList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-text-muted px-4 py-8">
                        <UserCircle className="w-12 h-12 mb-3 opacity-40" />
                        <p className="text-sm text-center">暂无其他用户在线</p>
                        <p className="text-xs text-center mt-1 opacity-60">等待其他用户加入</p>
                      </div>
                    ) : (
                      onlineList.map(u => (
                        <button
                          key={u}
                          onClick={() => {
                            setTo(u);
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false);
                            setTimeout(() => {
                              if (messageInputRef.current) {
                                messageInputRef.current.focus();
                              }
                            }, 100);
                          }}
                          className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 flex items-center ${
                            to === u 
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700 shadow-sm' 
                              : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                            </div>
                            <span className="font-medium truncate flex-1">{u}</span>
                            {to === u && (
                              <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <div className="px-2 py-2 border-t border-border">
                  <button onClick={() => setCollapseHistory(!collapseHistory)} className="w-full flex items-center justify-between text-sm">
                    <span>历史会话</span>
                    <span>{collapseHistory ? '▶' : '▼'}</span>
                  </button>
                </div>
                {!collapseHistory && (
                  <div className="p-2 space-y-1">
                    {historyList.length === 0 ? (
                      <div className="text-xs text-text-muted px-3 py-2">暂无历史会话</div>
                    ) : (
                      historyList.map((c: any) => (
                        <div
                          key={c.peer}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setTo(c.peer);
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false);
                            setTimeout(() => { if (messageInputRef.current) messageInputRef.current.focus(); }, 100);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setTo(c.peer);
                              if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowSidebar(false);
                              setTimeout(() => { if (messageInputRef.current) messageInputRef.current.focus(); }, 100);
                            }
                          }}
                          className={`w-full p-3 rounded-lg text-sm transition-all duration-200 flex items-center cursor-pointer ${to === c.peer ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700 shadow-sm' : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text hover:shadow-sm'}`}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full mr-3 ${stableOnline.includes(c.peer) ? 'bg-success' : 'bg-gray-400'}`}></div>
                            </div>
                            <span className="font-medium truncate flex-1">{c.peer}</span>
                            {unreadByPeer[c.peer] > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white flex-shrink-0">{unreadByPeer[c.peer]}</span>
                            )}
                            {to === c.peer && <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>}
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
                              await fetch(`${base}/api/conversations/${c.peer}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } } as RequestInit);
                              setMessages(prev => { const next: Record<string, any[]> = { ...prev }; delete next[c.peer]; return next; });
                              fetchConversations();
                            }}
                            className="ml-2 px-2 py-1 text-xs rounded-md border"
                          >
                            删除
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </aside>
            <main className="flex-1 flex flex-col min-w-0 bg-surface dark:bg-surface-900">
              {to && (
                <div className="bg-elevated border-b border-border px-4 sm:px-6 flex-shrink-0 h-[76px] flex flex-col justify-center">
                  <div className="flex itemscenter justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="mr-3 flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-text truncate"> {to}</h2>
                        
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div id="chat" ref={chatBodyRef} onScroll={() => {
                const el = chatBodyRef.current;
                if (!el || !to || loadingMore) return;
                const now = Date.now();
                if (now - scrollThrottleRef.current < 80) return;
                scrollThrottleRef.current = now;
                el.classList.add('scrolling');
                if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
                scrollTimerRef.current = setTimeout(() => { if (el) el.classList.remove('scrolling'); }, 800);
                if (el.scrollTop <= 8 && cursors[to]) {
                  lastActionRef.current = 'loadMore';
                  setLoadingMore(true);
                  const prevHeight = el.scrollHeight;
                  fetchHistory(to, cursors[to] || undefined).then((data: any) => {
                    requestAnimationFrame(() => {
                      const newHeight = el.scrollHeight;
                      if (data && Array.isArray(data.messages) && data.messages.length > 0) {
                        el.scrollTop = newHeight - prevHeight;
                      }
                      setLoadingMore(false);
                    });
                  });
                }
              }} className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-on-scroll chat-scroll relative">
                {!to ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted">
                    <div className="text-center max-w-sm">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
                      <h3 className="text-lg font-medium mb-2">选择用户开始聊天</h3>
                      <p className="text-sm opacity-70">在左侧选择一个用户开始对话，体验即时通讯的便利</p>
                    </div>
                  </div>
                ) : !messages[to] || messages[to].length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted">
                    <div className="text-center max-w-sm">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
                      <h3 className="text-lg font-medium mb-2">暂无消息</h3>
                      <p className="text-sm opacity-70">发送第一条消息，开启与 {to} 的对话</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loadingMore && (
                      <div className="flex justify-center">
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-xs text-text-muted">加载中...</span>
                      </div>
                    )}
                    {loadError[to] && (
                      <div className="flex justify-center">
                        <button onClick={() => { setLoadingMore(true); fetchHistory(to, cursors[to] || undefined).then(() => setLoadingMore(false)); }} className="px-3 py-1 text-xs rounded-md border">加载失败，重试</button>
                      </div>
                    )}
                    {!cursors[to] && (messages[to] && messages[to].length > 0) && !loadingMore && !loadError[to] && (
                      <div className="flex justify-center text-xs text-text-muted">没有更多历史</div>
                    )}
                    {messages[to].map((m: any, i: number) => (
                      <div key={i} className={`flex ${m.from === userId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          m.from === userId 
                            ? 'bg-primary-500 text-white rounded-br-none' 
                            : 'bg-elevated text-text rounded-bl-none'
                        }`}>
                          <div className="flex items-center text-xs mb-1 opacity-75">
                            <span className={`font-medium ${m.from === userId ? 'text-white' : 'text-text-muted'}`}>
                              {m.from === userId ? '我' : m.from}
                            </span>
                            <span className="mx-2">•</span>
                            <span className={m.from === userId ? 'text-white' : 'text-text-muted'}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end space-x-2 sm:space-x-3">
                  <div className="flex items-end space-x-1 sm:space-x-2">
                    <button type="button" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="表情">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button type="button" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="文件">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <div className={`
                      min-h-[40px] sm:min-h-[44px] max-h-[120px] overflow-y-auto
                      bg-gray-50 dark:bg-gray-700 
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg sm:rounded-xl
                      transition-all duration-200
                      ${to ? 'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500' : ''}
                      ${!to ? 'opacity-75' : ''}
                    `}>
                      <input
                        ref={messageInputRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={to ? `发送消息给 ${to}...` : ''}
                        disabled={!to}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border-0 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 resize-none disabled:cursor-not-allowed"
                      />
                      {!to && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="w-4 h-4 opacity-60" />
                            <span>请先选择一个用户开始聊天</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="submit" disabled={!to || !text.trim()} className={`
                      w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                      bg-primary-500 text-white 
                      hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 
                      transition-all duration-200 transform 
                      hover:scale-105 active:scale-95
                      ${text.trim() && to ? 'shadow-lg hover:shadow-xl' : ''}
                    `}
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </form>
              </div>
            </main>
            {confirmDeletePeer && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-elevated border border-border rounded-lg p-4 w-80">
                  <div className="text-sm mb-3">确认删除会话 {confirmDeletePeer}？</div>
                  <label className="flex items-center text-xs mb-3">
                    <input type="checkbox" checked={skipDeleteConfirm} onChange={(e) => { setSkipDeleteConfirm(e.target.checked); localStorage.setItem('skip_delete_confirm', e.target.checked ? 'true' : 'false'); }} className="mr-2" />
                    不再提示
                  </label>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setConfirmDeletePeer(null)} className="px-3 py-1 text-xs rounded-md border">取消</button>
                    <button onClick={() => doDelete(confirmDeletePeer)} className="px-3 py-1 text-xs rounded-md bg-red-500 text-white">删除</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
