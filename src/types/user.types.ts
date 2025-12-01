import type { User } from './auth.types';

export interface OnlineUser {
  id: string;
  email: string;
  isOnline: boolean;
  lastSeen?: number;
}

export interface UserSearchResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserState {
  onlineUsers: OnlineUser[];
  searchResults: User[];
  isSearching: boolean;
  searchError: string | null;
}