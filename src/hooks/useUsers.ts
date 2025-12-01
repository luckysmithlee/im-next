import { useState, useEffect } from 'react';
import type { UserStore } from '@/stores/userStore';

export function useUsers(userStore: UserStore) {
  const [state, setState] = useState(userStore.getState());

  useEffect(() => {
    return userStore.subscribe(setState);
  }, [userStore]);

  return {
    onlineUsers: state.onlineUsers,
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    searchError: state.searchError,
    searchUsers: userStore.searchUsers.bind(userStore),
    updateOnlineUsers: userStore.updateOnlineUsers.bind(userStore),
  };
}