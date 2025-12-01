import { useCallback, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { ChatStore } from '../../stores/chatStore';
import { AuthStore } from '../../stores/authStore';
 

interface ChatWindowProps {
  chatStore: ChatStore;
  authStore: AuthStore;
  selectedUser?: import('../../types/auth.types').User;
  className?: string;
}

export function ChatWindow({ chatStore, authStore, selectedUser, className = '' }: ChatWindowProps) {
  const { user } = useAuth(authStore);
  const { 
    activePeer, 
    isLoading, 
    error, 
    loadMessages, 
    sendMessage 
  } = useChat(chatStore);

  // Load initial messages when component mounts or selected user changes
  useEffect(() => {
    if (activePeer) {
      loadMessages(activePeer);
    }
  }, [activePeer, loadMessages]);

  // Handle message sending
  const handleSendMessage = useCallback(async (content: string) => {
    if (!activePeer || !content.trim()) return;
    try {
      await sendMessage(content.trim());
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [activePeer, sendMessage]);

  // Handle loading more messages
  const handleLoadMore = useCallback(() => {
    if (activePeer && !isLoading) {
      const currentLength = chatStore.getMessages(activePeer).length;
      loadMessages(activePeer, currentLength);
    }
  }, [activePeer, isLoading, loadMessages, chatStore]);

  // No user selected state
  if (!selectedUser) {
    return (
      <div className={`flex flex-col h-full bg-white ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">选择一个用户开始聊天</h3>
            <p className="text-gray-500">从左侧用户列表中选择一个用户开始对话</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Chat Header */}
      <ChatHeader 
        user={selectedUser}
        onClose={() => chatStore.setActivePeer(null)}
        className="border-b border-gray-200"
      />

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={activePeer ? chatStore.getMessages(activePeer) : []}
          currentUserId={user?.id || ''}
          isLoading={isLoading}
          error={error}
          onLoadMore={handleLoadMore}
          className="h-full"
        />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`发送消息给 ${(selectedUser?.nickname || selectedUser?.email) ?? ''}...`}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
