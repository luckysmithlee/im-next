import React from 'react';
import { User } from '../../types/auth.types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface UserItemProps {
  user: User;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function UserItem({ user, isSelected = false, onClick, className = '' }: UserItemProps) {
  const hasUnread = user.unreadCount && user.unreadCount > 0;
  
  return (
    <div
      className={`
        flex items-center p-3 cursor-pointer transition-colors duration-200
        ${isSelected 
          ? 'bg-blue-50 border-r-2 border-blue-500' 
          : 'hover:bg-gray-50'
        }
        ${className}
      `}
      onClick={onClick}
    >
      <Avatar 
        src={user.avatar} 
        alt={user.name}
        size="sm"
        online={user.online}
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-medium truncate ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {user.name}
          </h4>
          
          {hasUnread && (
            <Badge variant="danger" size="xs" className="ml-2">
              {user.unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className={`text-xs truncate ${
            isSelected ? 'text-blue-700' : 'text-gray-500'
          }`}>
            {user.lastMessage || '暂无消息'}
          </p>
          
          <Badge 
            variant={user.online ? 'success' : 'secondary'}
            size="xs"
            className="ml-2"
          >
            {user.online ? '在线' : '离线'}
          </Badge>
        </div>
        
        {user.lastMessageTime && (
          <p className={`text-xs mt-1 ${
            isSelected ? 'text-blue-600' : 'text-gray-400'
          }`}>
            {new Date(user.lastMessageTime).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}