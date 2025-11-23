import { useState, useEffect } from 'react';
import { MessageCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

// 模拟用户数据
const MOCK_USERS = [
  { email: 'test1@example.com', password: '123456', id: 'user1' },
  { email: 'test2@example.com', password: '123456', id: 'user2' },
  { email: 'test3@example.com', password: '123456', id: 'user3' }
];

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 加载保存的自动登录偏好
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('chat_remember_me') === 'true';
    const savedEmail = localStorage.getItem('chat_saved_email');
    
    if (savedRememberMe && savedEmail) {
      setRememberMe(true);
      setEmail(savedEmail);
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      // 模拟认证延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 查找匹配的用户
      const user = MOCK_USERS.find(u => u.email === email.trim() && u.password === password.trim());
      
      if (!user) {
        setErr('邮箱或密码不正确');
        return;
      }
      
      // 生成模拟token
      const mockToken = `mock_jwt_${user.id}_${Date.now()}`;
      
      // 保存自动登录偏好
      if (rememberMe) {
        localStorage.setItem('chat_remember_me', 'true');
        localStorage.setItem('chat_saved_email', email);
      } else {
        localStorage.removeItem('chat_remember_me');
        localStorage.removeItem('chat_saved_email');
      }
      
      onLogin(mockToken, user.id, user.email, rememberMe);
      
    } catch (error) {
      setErr('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-surface to-white dark:from-surface-900 dark:to-black px-4 sm:px-6">
      <div className="w-full max-w-sm bg-elevated border border-border rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-xl grid place-items-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">欢迎回来</h1>
          <p className="text-text-muted text-sm">登录以继续聊天</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
              邮箱地址
            </label>
            <input 
                id="email"
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="请输入您的邮箱"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
              密码
            </label>
            <div className="relative">
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="请输入密码"
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text transition-colors"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {err && (
            <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg p-3" role="alert">
              {err}
            </div>
          )}

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-text-muted">
              自动登录
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3 bg-primary-500 text-white rounded-lg text-base font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                正在登录...
              </span>
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted">
            测试账户：test1@example.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
}