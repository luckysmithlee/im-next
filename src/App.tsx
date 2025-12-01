import { useState, useEffect, useCallback } from 'react';
import { Login } from './components/auth/Login';
import { MainLayout } from './components/layout/MainLayout';
import { AuthStore } from './stores/authStore';
import { ChatStore } from './stores/chatStore';
import { UserStore } from './stores/userStore';
import { SocketService } from './services/chat/SocketService';
import { useAuth } from './hooks/useAuth';
import { useUsers } from './hooks/useUsers';
import { useSocket } from './hooks/useSocket';
import { HttpClient, AuthApi, ChatApi } from './services/api';
import { AuthService } from './services/auth/AuthService';
import { ChatService } from './services/chat/ChatService';
import { TokenManager } from './services/auth/TokenManager';
 

// Initialize services
const httpClient = new HttpClient();
const tokenManager = new TokenManager();
const authApi = new AuthApi(httpClient);
const chatApi = new ChatApi(httpClient);
 
const socketService = new SocketService();
const authService = new AuthService(tokenManager, authApi);

// Initialize stores
const authStore = new AuthStore(authService);
const chatStore = new ChatStore(new ChatService(chatApi, socketService), socketService);
const userStore = new UserStore(httpClient);

function App() {
  const { isAuthenticated, isLoading: authLoading, error: authError, login, logout } = useAuth(authStore);
  const { searchResults, searchError } = useUsers(userStore);
  const { connect, disconnect } = useSocket(socketService);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Handle login
  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      await login(email, password);
      const token = tokenManager.getAccessToken();
      if (token) {
        await connect(token);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [login, connect]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      if (socketService.isConnected()) {
        disconnect();
      }
      chatStore.setActivePeer(null);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, disconnect]);

  // Show loading state during initialization
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleLogin}
        error={authError}
        isLoading={authLoading}
      />
    );
  }

  // Show main application if authenticated
  return (
    <div className="h-screen bg-gray-50">
      {searchError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{searchError}</p>
            </div>
          </div>
        </div>
      )}
      
      <MainLayout
        users={searchResults}
        authStore={authStore}
        chatStore={chatStore}
        onLogout={handleLogout}
        className="h-full"
      />
    </div>
  );
}

export default App;
