import React, { useState, useCallback } from 'react';
import { User } from '../../types/auth.types';
import { UserList } from '../chat/UserList';
import { UserSearch } from '../chat/UserSearch';

interface SidebarProps {
  users: User[];
  selectedUserId?: string;
  currentUserId?: string;
  onUserSelect: (user: User) => void;
  className?: string;
}

export function Sidebar({ 
  users, 
  selectedUserId, 
  currentUserId, 
  onUserSelect, 
  className = '' 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredUsers(filtered);
  }, [users]);

  // Update filtered users when users prop changes
  React.useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchQuery, handleSearch]);

  return (
    <div className={`flex flex-col bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <UserSearch 
          onSearch={handleSearch}
          placeholder="搜索用户..."
          className="w-full"
        />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <UserList
          users={filteredUsers}
          selectedUserId={selectedUserId}
          currentUserId={currentUserId}
          onUserSelect={onUserSelect}
          className="h-full"
        />
      </div>
    </div>
  );
}