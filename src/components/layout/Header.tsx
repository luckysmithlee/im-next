import React from 'react';
import { User } from '../../types/auth.types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface HeaderProps {
  currentUser?: User;
  onLogout?: () => void;
  className?: string;
}

export function Header({ currentUser, onLogout, className = '' }: HeaderProps) {
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">即时聊天</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {currentUser && (
            <>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">在线</p>
                </div>
                <Avatar 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  size="sm"
                  online={true}
                />
              </div>
              
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  退出登录
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}