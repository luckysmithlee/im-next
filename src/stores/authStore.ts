import type { AuthState, User, AuthTokens } from '@/types';
import type { IAuthService } from '@/services/auth/AuthService';

export class AuthStore {
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor(private authService: IAuthService) {}

  async login(email: string, password: string): Promise<void> {
    this.setState({ ...this.state, isLoading: true, error: null });
    
    try {
      const tokens = await this.authService.login(email, password);
      const user = this.authService.getCurrentUser();
      
      this.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      this.setState({
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : '登录失败',
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.setState({ ...this.state, isLoading: true, error: null });
    
    try {
      await this.authService.logout();
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      this.setState({
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : '登出失败',
      });
      throw error;
    }
  }

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: AuthState): void {
    this.state = newState;
    this.listeners.forEach(listener => listener(this.state));
  }
}