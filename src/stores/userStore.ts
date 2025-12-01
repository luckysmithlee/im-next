import type { UserState, OnlineUser, UserSearchResult } from '@/types';
import type { HttpClient } from '@/services/api';

export class UserStore {
  private state: UserState = {
    onlineUsers: [],
    searchResults: [],
    isSearching: false,
    searchError: null,
  };

  private listeners: Set<(state: UserState) => void> = new Set();

  constructor(private httpClient: HttpClient) {}

  async searchUsers(query: string): Promise<void> {
    if (!query.trim()) {
      this.setState({
        ...this.state,
        searchResults: [],
        searchError: null,
      });
      return;
    }

    this.setState({
      ...this.state,
      isSearching: true,
      searchError: null,
    });

    try {
      const response = await this.httpClient.get<UserSearchResult>('/api/users/search', { query });
      this.setState({
        ...this.state,
        searchResults: response.users || [],
        isSearching: false,
        searchError: null,
      });
    } catch (error) {
      this.setState({
        ...this.state,
        searchResults: [],
        isSearching: false,
        searchError: error instanceof Error ? error.message : '搜索失败',
      });
    }
  }

  updateOnlineUsers(users: string[]): void {
    const onlineUsers: OnlineUser[] = users.map(userId => ({
      id: userId,
      email: userId,
      isOnline: true,
    }));

    this.setState({
      ...this.state,
      onlineUsers,
    });
  }

  getState(): UserState {
    return this.state;
  }

  subscribe(listener: (state: UserState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: UserState): void {
    this.state = newState;
    this.listeners.forEach(listener => listener(this.state));
  }
}
