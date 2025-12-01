import { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/types';

export interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  isLoading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  className?: string;
}

export function MessageList({ 
  messages, 
  currentUserId, 
  isLoading = false, 
  error = null,
  onLoadMore,
  className 
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    setIsAtBottom(isBottom);

    if (el.scrollTop <= 8 && onLoadMore && !isLoading) {
      onLoadMore();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          {onLoadMore && (
            <button 
              onClick={onLoadMore}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-text-muted">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-sm">暂无消息</p>
          <p className="text-xs opacity-70 mt-1">开始一段对话吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className={className}
      onScroll={handleScroll}
    >
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.from === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}