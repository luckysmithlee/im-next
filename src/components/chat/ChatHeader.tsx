import React from 'react';
import { User } from '../../types/auth.types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ChatHeaderProps {
  user: User;
  onClose?: () => void;
  className?: string;
}

export function ChatHeader({ user, onClose, className = '' }: ChatHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center space-x-3">
        <Avatar 
          src={user.avatar} 
          alt={user.name}
          size="md"
          online={user.online}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {user.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge 
              variant={user.online ? 'success' : 'secondary'}
              size="sm"
            >
              {user.online ? '在线' : '离线'}
            </Badge>
            {user.lastSeen && (
              <span className="text-xs text-gray-500">
                最后上线: {new Date(user.lastSeen).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-4"
          aria-label="关闭聊天"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      )}
    </div>
  );
}