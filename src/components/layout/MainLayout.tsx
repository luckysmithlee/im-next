 
import { User } from '../../types/auth.types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { ChatStore } from '../../stores/chatStore';
import { AuthStore } from '../../stores/authStore';
 

interface MainLayoutProps {
  users: User[];
  authStore: AuthStore;
  chatStore: ChatStore;
  onLogout?: () => void;
  className?: string;
}

export function MainLayout({ 
  users, 
  authStore, 
  chatStore, 
  onLogout, 
  className = '' 
}: MainLayoutProps) {
  const { user } = authStore.getState();
  const { activePeer } = chatStore.getState();

  const handleUserSelect = (u: User) => {
    chatStore.setActivePeer(u.id);
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${className}`}>
      {/* Header */}
        <Header 
        currentUser={user}
        onLogout={onLogout}
        className="flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Sidebar
            users={users}
            selectedUserId={activePeer || undefined}
            currentUserId={user?.id}
            onUserSelect={handleUserSelect}
            className="h-full"
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            chatStore={chatStore}
            authStore={authStore}
            selectedUser={users.find(u => u.id === activePeer)}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
