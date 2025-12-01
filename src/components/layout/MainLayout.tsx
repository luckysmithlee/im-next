import React from 'react';
import { User } from '../../types/auth.types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { ChatStore } from '../../stores/chatStore';
import { AuthStore } from '../../stores/authStore';
import { SocketService } from '../../services/chat/SocketService';

interface MainLayoutProps {
  users: User[];
  authStore: AuthStore;
  chatStore: ChatStore;
  socketService: SocketService;
  onLogout?: () => void;
  className?: string;
}

export function MainLayout({ 
  users, 
  authStore, 
  chatStore, 
  socketService, 
  onLogout, 
  className = '' 
}: MainLayoutProps) {
  const { currentUser } = authStore.getState();
  const { selectedUser } = chatStore.getState();

  const handleUserSelect = (user: User) => {
    chatStore.setSelectedUser(user);
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <Header 
        currentUser={currentUser}
        onLogout={onLogout}
        className="flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Sidebar
            users={users}
            selectedUserId={selectedUser?.id}
            currentUserId={currentUser?.id}
            onUserSelect={handleUserSelect}
            className="h-full"
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            chatStore={chatStore}
            authStore={authStore}
            socketService={socketService}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}