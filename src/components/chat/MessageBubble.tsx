import { cn, formatTimestamp } from '@/utils';
import type { Message } from '@/types';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  className?: string;
}

export function MessageBubble({ message, isOwn, className }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start', className)}>
      <div
        className={cn(
          'max-w-[75%] sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl shadow-sm',
          isOwn
            ? 'bg-primary-500 text-white rounded-br-none'
            : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
        )}
      >
        <div className="flex items-center text-xs mb-1 opacity-75">
          <span className={cn('font-medium', isOwn ? 'text-white' : 'text-gray-600')}>
            {isOwn ? '我' : message.from}
          </span>
          <span className="mx-2">•</span>
          <span className={isOwn ? 'text-white' : 'text-gray-600'}>
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.pending && (
          <div className="flex items-center mt-1 opacity-60">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1" />
            <span className="text-xs">发送中...</span>
          </div>
        )}
      </div>
    </div>
  );
}