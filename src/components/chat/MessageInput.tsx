import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/utils';

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = '输入消息...',
  className 
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex items-end space-x-2', className)}>
      <div className="flex-1 relative">
        <div className={cn(
          'min-h-[40px] max-h-[120px] overflow-y-auto',
          'bg-gray-50 border border-gray-200 rounded-lg',
          'transition-all duration-200',
          'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
          disabled && 'opacity-75'
        )}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? '' : placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 bg-transparent border-0 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
          />
          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              <div className="flex items-center space-x-2">
                <span>请先选择一个用户开始聊天</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          'bg-primary-500 text-white',
          'hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500',
          'transition-all duration-200 transform',
          'hover:scale-105 active:scale-95',
          message.trim() && !disabled ? 'shadow-lg hover:shadow-xl' : ''
        )}
        title="发送消息"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}