import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import LoginForm from '../components/LoginForm';
import io from 'socket.io-client';
import { Menu, X, Users, MessageCircle, Send, UserCircle } from 'lucide-react';

let socket;

export default function Home() {
  const [token, setToken] = useState(null);
  const [online, setOnline] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [messages, setMessages] = useState({}); // 按用户分组存储消息
  const [cursors, setCursors] = useState({}); // 每个会话的分页游标（下一次before）
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 添加加载状态
  const [unreadByPeer, setUnreadByPeer] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState({});
  const messageInputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const tailTsRef = useRef(0);
  const scrollTimerRef = useRef(null);
  const lastActionRef = useRef(null);
  const scrollThrottleRef = useRef(0);
  const [conversations, setConversations] = useState([]);
  const [collapseHistory, setCollapseHistory] = useState(false);
  const [collapseOnline, setCollapseOnline] = useState(false);
  const [stableOnline, setStableOnline] = useState([]);
  const onlineUpdateTimerRef = useRef(null);
  const unreadUpdateTimerRef = useRef(null);
  const activePeerRef = useRef('');
  const onlineList = useMemo(() => stableOnline.filter(u => u !== userId), [stableOnline, userId]);
  const historyList = useMemo(() => conversations.filter(c => !stableOnline.includes(c.peer)), [conversations, stableOnline]);

  async function fetchJSON(url, options = {}, retry = 2, timeout = 6000) {
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

  function scrollToBottom() {
    const el = chatBodyRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }

  

  // 持久化登录状态 - 增强版自动登录
  useEffect(() => {
    const savedToken = localStorage.getItem('chat_token');
    const savedUserId = localStorage.getItem('chat_userId');
    const savedUserEmail = localStorage.getItem('chat_userEmail');
    const rememberMe = localStorage.getItem('chat_remember_me') === 'true';
    
    if (savedToken && savedUserId && savedUserEmail) {
      // 验证token是否过期（简单的过期检查）
      const tokenParts = savedToken.split('_');
      const tokenTimestamp = tokenParts[tokenParts.length - 1];
      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const maxTokenAge = 7 * 24 * 60 * 60 * 1000; // 7天有效期
      
      if (tokenAge < maxTokenAge) {
        // Token有效，执行自动登录
        handleLogin(savedToken, savedUserId, savedUserEmail, rememberMe);
      } else {
        // Token过期，清除本地存储
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
    setIsLoading(false); // 完成加载检查
  }, []);

  function handleLogout() {
    // 清除本地存储的登录状态
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_userId');
    localStorage.removeItem('chat_userEmail');
    
    // 如果用户没有选择记住我，则清除记住我相关数据
    const rememberMe = localStorage.getItem('chat_remember_me') === 'true';
    if (!rememberMe) {
      localStorage.removeItem('chat_remember_me');
      localStorage.removeItem('chat_saved_email');
    }
    
    // 断开 socket 连接
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    
    // 重置状态 - 不需要设置加载状态，直接回到登录页
    setToken(null);
    setUserId(null);
    setUserEmail('');
    setMessages({});
    setTo('');
    setText('');
    setOnline([]);
    // 注意：不设置 isLoading，直接显示登录表单
  }

  function handleLogin(tkn, userId, email, rememberMe = false) {
    setToken(tkn);
    setUserId(userId);
    setUserEmail(email);
    
    // 保存登录状态到本地存储
    localStorage.setItem('chat_token', tkn);
    localStorage.setItem('chat_userId', userId);
    localStorage.setItem('chat_userEmail', email);
    
    // 如果用户选择了记住我，保存偏好
    if (rememberMe) {
      localStorage.setItem('chat_remember_me', 'true');
      localStorage.setItem('chat_saved_email', email);
    }
    
    // 建立 socket 连接并带上 token
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      auth: { token: tkn },
      transports: ['websocket']
    });
    socket.on('connect_error', (err) => console.error('Socket.IO连接失败：', err.message || err));
    socket.on('online_users', (list) => setOnline(list));
    socket.on('private_message', (msg) => {
      setMessages(prev => {
        const fromUser = msg.from === userId ? msg.to : msg.from;
        const list = prev[fromUser] || [];
        if (msg.clientId) {
          const idx = list.findIndex(m => m.clientId === msg.clientId);
          if (idx >= 0) {
            const next = [...list];
            next[idx] = msg;
            return { ...prev, [fromUser]: next };
          }
        }
        return { ...prev, [fromUser]: [...list, msg] };
      });
      if (msg.from !== userId && to !== msg.from) {
        setUnreadByPeer(prev => ({
          ...prev,
          [msg.from]: (prev[msg.from] || 0) + 1
        }));
        setTotalUnread(prev => prev + 1);
      }
    });
    socket.on('unread_counts', (payload) => {
      const byPeer = (payload && payload.byPeer) || {};
      const total = (payload && payload.total) || 0;
      if (unreadUpdateTimerRef.current) clearTimeout(unreadUpdateTimerRef.current);
      unreadUpdateTimerRef.current = setTimeout(() => {
        setUnreadByPeer(byPeer);
        setTotalUnread(total);
      }, 350);
    });
    fetchConversations(tkn);
    
    setIsLoading(false); // 登录完成后设置加载状态为false
  }

  async function fetchConversations(tok) {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const data = await fetchJSON(`${base}/api/conversations`, { headers: { Authorization: `Bearer ${tok || token}` } });
    if (!data) return;
    setConversations(data.conversations || []);
  }

  // 当选择用户时自动聚焦到消息输入框
  useEffect(() => {
    if (to && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [to]);

  // 当切换用户时清空输入框
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
      pending: true
    };
    setMessages(prev => ({
      ...prev,
      [to]: [...(prev[to] || []), msg]
    }));
    socket.emit('private_message', { to, content: text, clientId });
    setText('');
    lastActionRef.current = 'send';
  }

  async function fetchHistory(peer, before) {
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const url = new URL(`${base}/api/messages/${peer}`);
    if (before) url.searchParams.set('before', String(before));
    url.searchParams.set('limit', '20');
    let data;
    try {
      const resp = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) {
        setLoadError(prev => ({ ...prev, [peer]: true }));
        return;
      }
      data = await resp.json();
      setLoadError(prev => ({ ...prev, [peer]: false }));
    } catch (e) {
      setLoadError(prev => ({ ...prev, [peer]: true }));
      return;
    }
    // Guard against out-of-date responses when rapidly switching sessions
    if (!before && activePeerRef.current && activePeerRef.current !== peer) {
      return;
    }
    setMessages(prev => ({
      ...prev,
      [peer]: before
        ? [...(data.messages || []), ...(prev[peer] || [])]
        : (data.messages || [])
    }));
    setCursors(prev => ({
      ...prev,
      [peer]: data.nextCursor || null
    }));
    return data;
  }

  useEffect(() => {
    if (to && token) {
      activePeerRef.current = to;
      lastActionRef.current = 'init';
      fetchHistory(to).then(() => {
        
      });
      if (socket) {
        socket.emit('mark_read', { peer: to });
      }
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      fetch(`${base}/api/read/${to}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        .then(resp => resp.json())
        .then(data => {
          if (data && data.byPeer) {
            setUnreadByPeer(data.byPeer);
            setTotalUnread(data.total || 0);
          }
        })
        .catch(() => {});
    }
  }, [to, token]);

  useEffect(() => {
    if (onlineUpdateTimerRef.current) clearTimeout(onlineUpdateTimerRef.current);
    onlineUpdateTimerRef.current = setTimeout(() => {
      setStableOnline(online || []);
    }, 350);
    return () => {
      if (onlineUpdateTimerRef.current) clearTimeout(onlineUpdateTimerRef.current);
    };
  }, [online]);

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
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    fetchJSON(`${base}/api/unread`, { headers: { Authorization: `Bearer ${token}` } })
      .then(data => {
        if (!data) return;
        if (unreadUpdateTimerRef.current) clearTimeout(unreadUpdateTimerRef.current);
        unreadUpdateTimerRef.current = setTimeout(() => {
          setUnreadByPeer(data.byPeer || {});
          setTotalUnread(data.total || 0);
        }, 350);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-900">
      {isLoading ? (
        // 加载状态，显示空白或加载动画
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
          {/* Header */}
          <header className="bg-primary-500 text-white px-4 py-3 text-center shadow-md">
            <div className="flex items-center justify-between w-full">
              {/* Left section - Menu and Title */}
              <div className="flex items-center flex-shrink-0">
                {/* Mobile menu button */}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 rounded-md hover:bg-primary-600 transition-colors flex-shrink-0"
                  aria-label="切换用户侧边栏"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold ml-4">聊天应用{totalUnread > 0 ? `（未读 ${totalUnread}）` : ''}</h1>
              </div>
              
              {/* Center section - User info */}
              <div className="hidden sm:flex flex-1 items-center justify-center text-sm opacity-90 min-w-0 px-2 mx-2">
                {/* 超大屏幕显示完整信息 */}
                <span className="hidden xl:inline truncate max-w-lg">{userEmail} (ID: {userId})</span>
                {/* 大屏幕显示邮箱和ID */}
                <span className="hidden lg:inline xl:hidden truncate max-w-md">{userEmail} (ID: {userId})</span>
                {/* 中等屏幕只显示邮箱 */}
                <span className="hidden md:inline lg:hidden truncate max-w-[200px]">{userEmail}</span>
                {/* 小屏幕只显示ID */}
                <span className="md:hidden truncate max-w-[150px]">ID: {userId}</span>
              </div>
              
              {/* Right section - Logout button */}
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
          </header>

          {/* Main Chat Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Online Users */}
            <aside className={`${showSidebar ? 'flex' : 'hidden lg:flex'} w-64 bg-elevated border-r border-border flex-col absolute lg:relative inset-y-0 left-0 z-10 lg:z-auto h-full`}>
              {/* Header Section */}
              <div className="px-4 sm:px-6 py-4 border-b border-border flex-shrink-0 h-[76px] flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-3 flex-shrink-0">
                      <Users className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-text truncate">在线用户{totalUnread > 0 ? ` · 未读 ${totalUnread}` : ''}</h2>
                      <div className="flex items-center text-xs text-text-muted">
                        <span className="font-medium">{onlineList.length} 位</span>
                      </div>
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
                      historyList.map(c => (
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
                              await fetch(`${base}/api/conversations/${c.peer}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              setMessages(prev => { const next = { ...prev }; delete next[c.peer]; return next; });
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

            {/* Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-surface dark:bg-surface-900">
              {/* Chat Header - 仅在选中用户时展示 */}
              {to && (
                <div className="bg-elevated border-b border-border px-4 sm:px-6 flex-shrink-0 h-[76px] flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="mr-3 flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-text truncate"> {to}</h2>
                        <div className="text-xs text-success">
                          在线
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div id="chat" ref={chatBodyRef} onScroll={() => {
                const el = chatBodyRef.current;
                if (!el || !to || loadingMore) return;
                const now = Date.now();
                if (now - scrollThrottleRef.current < 80) return;
                scrollThrottleRef.current = now;
                el.classList.add('scrolling');
                if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
                scrollTimerRef.current = setTimeout(() => {
                  el.classList.remove('scrolling');
                }, 800);
                if (el.scrollTop <= 8 && cursors[to]) {
                  lastActionRef.current = 'loadMore';
                  setLoadingMore(true);
                  const prevHeight = el.scrollHeight;
                  fetchHistory(to, cursors[to]).then((data) => {
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
                        <button onClick={() => { setLoadingMore(true); fetchHistory(to, cursors[to]).then(() => setLoadingMore(false)); }} className="px-3 py-1 text-xs rounded-md border">加载失败，重试</button>
                      </div>
                    )}
                    {!cursors[to] && (messages[to] && messages[to].length > 0) && !loadingMore && !loadError[to] && (
                      <div className="flex justify-center text-xs text-text-muted">没有更多历史</div>
                    )}
                    {messages[to].map((m, i) => (
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

              {/* Message Input - WeChat Style */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end space-x-2 sm:space-x-3">
                  {/* Extension buttons area - for future features */}
                  <div className="flex items-end space-x-1 sm:space-x-2">
                    <button
                      type="button"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="表情"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="文件"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                  </div>

                  {/* Input area */}
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

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!to || !text.trim()}
                    className={`
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
          </div>
        </div>
      )}
    </div>
  );
}
