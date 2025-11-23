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
            <aside className={`${showSidebar ? 'flex' : 'hidden lg:flex'} w-64 bg-elevated border-r border-border flex-col absolute lg:relative inset-y-0 left-0 z-10 lg:z-auto h-full`}>
              {/* Header Section */}
              <div className="px-4 sm:px-6 py-4 border-b border-border flex-shrink-0 h-[76px] flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-3 flex-shrink-0">
                      <Users className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-text truncate">在线用户</h2>
                      <div className="flex items-center text-xs text-text-muted">
                        <span className="font-medium">{online.filter(u => u !== userId).length} 位</span>
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
              
              {/* Users List */}
              <div className="flex-1 overflow-y-auto">
                {online.filter(u => u !== userId).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted px-4 py-8">
                    <UserCircle className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm text-center">暂无其他用户在线</p>
                    <p className="text-xs text-center mt-1 opacity-60">等待其他用户加入</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
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
                        className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 flex items-center ${
                          to === u 
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700 shadow-sm' 
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-text-muted hover:text-text hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-success rounded-full mr-3 animate-ping opacity-75"></div>
                          </div>
                          <span className="font-medium truncate flex-1">{u}</span>
                          {to === u && (
                            <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-surface dark:bg-surface-900">
              {/* Chat Header */}
              <div className="bg-elevated border-b border-border px-4 sm:px-6 flex-shrink-0 h-[76px] flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    {to ? (
                      <>
                        <div className="mr-3 flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-success" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-semibold text-text truncate"> {to}</h2>
                          <div className="text-xs text-success">
                            在线
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 text-text-muted mr-3 flex-shrink-0" />
                        <h2 className="text-lg font-semibold text-text-muted">选择用户开始聊天</h2>
                      </>
                    )}
                  </div>

                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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

              {/* Message Input */}
              <div className="bg-elevated border-t border-border p-4 sm:p-5 flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <input
                      ref={messageInputRef}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={to ? `发送消息给 ${to}...` : '请先选择一个用户'}
                      disabled={!to}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
                    />
                    {!to && (
                      <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm bg-surface-50/50 rounded-xl">
                        请先选择一个用户开始聊天
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!to || !text.trim()}
                    className="px-5 py-3 bg-primary-500 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center min-w-[60px]"
                  >
                    <Send className="w-5 h-5" />
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