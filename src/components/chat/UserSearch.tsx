import React, { useState, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface UserSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearch({ onSearch, placeholder = '搜索用户...', className = '' }: UserSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  }, [query, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Real-time search when user types
    if (value.trim() === '') {
      onSearch('');
    }
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="p-0 h-5 w-5 text-gray-400 hover:text-gray-600"
              aria-label="清除搜索"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}