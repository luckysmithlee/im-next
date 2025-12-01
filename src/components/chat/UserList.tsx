import React from 'react';
import { User } from '../../types/auth.types';
import { UserItem } from './UserItem';

interface UserListProps {
  users: User[];
  selectedUserId?: string;
  currentUserId?: string;
  onUserSelect: (user: User) => void;
  className?: string;
}

export function UserList({ 
  users, 
  selectedUserId, 
  currentUserId, 
  onUserSelect, 
  className = '' 
}: UserListProps) {
  // Filter out current user from the list
  const otherUsers = users.filter(user => user.id !== currentUserId);

  if (otherUsers.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-500 ${className}`}>
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-center">暂无其他用户</p>
        <p className="text-sm text-center mt-1">等待其他用户加入...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
        <p className="text-sm text-gray-500 mt-1">
          {otherUsers.length} 位用户在线
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {otherUsers.map((user) => (
          <UserItem
            key={user.id}
            user={user}
            isSelected={user.id === selectedUserId}
            onClick={() => onUserSelect(user)}
          />
        ))}
      </div>
    </div>
  );
}