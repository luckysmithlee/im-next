import { useState, useEffect } from 'react';
import type { AuthStore } from '@/stores/authStore';

export function useAuth(authStore: AuthStore) {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(setState);
  }, [authStore]);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login: authStore.login.bind(authStore),
    logout: authStore.logout.bind(authStore),
  };
}