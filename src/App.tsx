import React, { useState, useEffect, useCallback } from 'react';
import { Login } from './components/auth/Login';
import { MainLayout } from './components/layout/MainLayout';
import { AuthStore } from './stores/authStore';
import { ChatStore } from './stores/chatStore';
import { UserStore } from './stores/userStore';
import { SocketService } from './services/chat/SocketService';
import { useAuth } from './hooks/useAuth';
import { useUsers } from './hooks/useUsers';
import { useSocket } from './hooks/useSocket';

// Initialize stores and services
const authStore = new AuthStore();
const chatStore = new ChatStore();
const userStore = new UserStore();
const socketService = new SocketService();

function App() {
  const { isAuthenticated, isLoading: authLoading, error: authError, login, logout } = useAuth(authStore);
  const { users, isLoading: usersLoading, error: usersError, loadUsers } = useUsers(userStore);
  const { isConnected, error: socketError } = useSocket(socketService);

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication status
        await authStore.checkAuth();
        
        // Load users if authenticated
        if (authStore.getState().isAuthenticated) {
          await loadUsers();
          
          // Connect to socket if authenticated
          if (!socketService.isConnected()) {
            socketService.connect();
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [loadUsers]);

  // Handle login
  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      await login(email, password);
      
      // Load users after successful login
      await loadUsers();
      
      // Connect to socket
      if (!socketService.isConnected()) {
        socketService.connect();
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [login, loadUsers]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      // Disconnect socket
      if (socketService.isConnected()) {
        socketService.disconnect();
      }
      
      // Clear stores
      chatStore.clearMessages();
      chatStore.setSelectedUser(null);
      userStore.clearUsers();
      
      // Logout
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

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
      {usersError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{usersError}</p>
            </div>
          </div>
        </div>
      )}
      
      {socketError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{socketError}</p>
            </div>
          </div>
        </div>
      )}
      
      <MainLayout
        users={users}
        authStore={authStore}
        chatStore={chatStore}
        socketService={socketService}
        onLogout={handleLogout}
        className="h-full"
      />
    </div>
  );
}

export default App;