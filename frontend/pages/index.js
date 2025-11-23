import { useState, useRef, useEffect } from 'react';
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
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 添加加载状态
  const messageInputRef = useRef(null);

  // 持久化登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem('chat_token');
    const savedUserId = localStorage.getItem('chat_userId');
    const savedUserEmail = localStorage.getItem('chat_userEmail');
    
    if (savedToken && savedUserId && savedUserEmail) {
      handleLogin(savedToken, savedUserId, savedUserEmail);
    }
    setIsLoading(false); // 完成加载检查
  }, []);

  function handleLogout() {
    // 清除本地存储的登录状态
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_userId');
    localStorage.removeItem('chat_userEmail');
    
    // 断开 socket 连接
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    
    // 重置状态
    setToken(null);
    setUserId(null);
    setUserEmail('');
    setMessages({});
    setTo('');
    setText('');
    setOnline([]);
    setIsLoading(true); // 设置加载状态，防止闪烁
  }

  function handleLogin(tkn, userId, email) {
    setToken(tkn);
    setUserId(userId);
    setUserEmail(email);
    
    // 保存登录状态到本地存储
    localStorage.setItem('chat_token', tkn);
    localStorage.setItem('chat_userId', userId);
    localStorage.setItem('chat_userEmail', email);
    
    // 建立 socket 连接并带上 token
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      auth: { token: tkn }
    });
    socket.on('connect_error', (err) => console.error('Socket.IO连接失败：', err.message || err));
    socket.on('online_users', (list) => setOnline(list));
    socket.on('private_message', (msg) => {
      setMessages(prev => {
        const fromUser = msg.from === userId ? msg.to : msg.from;
        return {
          ...prev,
          [fromUser]: [...(prev[fromUser] || []), msg]
        };
      });
    });
    
    setIsLoading(false); // 登录完成后设置加载状态为false
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
    const msg = {
      from: userId,
      to: to,
      content: text,
      timestamp: Date.now()
    };
    socket.emit('private_message', { to, content: text });
    // 添加到当前聊天对象的消息历史中
    setMessages(prev => ({
      ...prev,
      [to]: [...(prev[to] || []), msg]
    }));
    setText('');
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-900">
      {isLoading ? (
        // 加载状态，显示空白或加载动画
        <div className="min-h-screen bg-surface dark:bg-surface-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-muted">加载中...</p>
          </div>
        </div>
      ) : !token ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div className="h-screen flex flex-col">
          {/* Header */}
          <header className="bg-primary-500 text-white px-4 py-3 text-center shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 rounded-md hover:bg-primary-600 transition-colors"
                  aria-label="切换用户侧边栏"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold">聊天应用</h1>
              </div>
              <div className="hidden sm:block text-sm opacity-90">
                {userEmail} (ID: {userId})
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                title="退出登录"
              >
                退出
              </button>
            </div>
          </header>

          {/* Main Chat Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Online Users */}
            <aside className={`${showSidebar ? 'block' : 'hidden lg:block'} w-64 bg-elevated border-r border-border flex flex-col absolute lg:relative inset-y-0 left-0 z-10 lg:z-auto h-full`}>
              <div className="p-3 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold text-text">在线用户</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    aria-label="关闭侧边栏"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-sm text-text-muted">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">{online.filter(u => u !== userId).length} 位用户在线</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {online.filter(u => u !== userId).length === 0 ? (
                  <div className="text-center text-text-muted py-6">
                    <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无其他用户</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {online.filter(u => u !== userId).map(u => (
                      <button
                        key={u}
                        onClick={() => {
                          setTo(u);
                          setShowSidebar(false);
                          // 延迟聚焦以确保侧边栏关闭后输入框可见
                          setTimeout(() => {
                            if (messageInputRef.current) {
                              messageInputRef.current.focus();
                            }
                          }, 100);
                        }}
                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                          to === u 
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800' 
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-success rounded-full mr-2 flex-shrink-0"></div>
                          <span className="font-medium truncate">{u}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Chat Header */}
              <div className="bg-elevated border-b border-border px-4 sm:px-6 py-3 flex-shrink-0">
                <h2 className="text-base font-semibold text-text truncate leading-6">
                  {to ? (
                    <span className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2 text-success flex-shrink-0" />
                      <span className="truncate">与 {to} 的聊天</span>
                    </span>
                  ) : (
                    '选择用户开始聊天'
                  )}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-50 dark:bg-surface-800">
                {!to ? (
                  <div className="text-center text-text-muted py-8 sm:py-12">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-30" />
                    <p className="text-base sm:text-lg mb-2">选择用户开始聊天</p>
                    <p className="text-sm">在左侧选择一个用户开始对话</p>
                  </div>
                ) : !messages[to] || messages[to].length === 0 ? (
                  <div className="text-center text-text-muted py-8 sm:py-12">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-30" />
                    <p className="text-base sm:text-lg mb-2">暂无消息</p>
                    <p className="text-sm">在下方发送消息开始对话</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {messages[to].map((m, i) => (
                      <div key={i} className={`flex ${m.from === userId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                          m.from === userId 
                            ? 'bg-primary-500 text-white rounded-br-none' 
                            : 'bg-elevated text-text rounded-bl-none shadow-sm'
                        }`}>
                          <div className="text-xs sm:text-sm">
                            <span className={`font-semibold ${m.from === userId ? 'opacity-75' : 'text-text-muted'}`}>
                              {m.from === userId ? '我' : m.from}
                            </span>
                            <span className="mx-1 sm:mx-2">•</span>
                            <span className={m.from === userId ? 'opacity-75' : 'text-text-muted'}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm sm:text-base">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-elevated border-t border-border p-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <label htmlFor="recipient" className="sr-only">收信人</label>
                    <input
                      id="recipient"
                      type="text"
                      placeholder="用户ID"
                      value={to}
                      onChange={e => setTo(e.target.value)}
                      className="w-20 px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  
                  <div className="flex-1 flex items-center">
                    <label htmlFor="message" className="sr-only">消息</label>
                    <input
                      id="message"
                      type="text"
                      placeholder={to ? "输入消息..." : "请先选择用户"}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      disabled={!to.trim()}
                      onKeyPress={(e) => e.key === 'Enter' && send()}
                      className="w-full px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  
                  <button
                    onClick={send}
                    disabled={!to.trim() || !text.trim()}
                    className={`flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      !to.trim() || !text.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600'
                    }`}
                    aria-label="发送消息"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}