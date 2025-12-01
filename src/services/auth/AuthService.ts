import type { User, LoginCredentials, AuthTokens } from '@/types';
import type { AuthApi } from '@/services/api';
import { TokenManager } from './TokenManager';
import { STORAGE_KEYS } from '@/utils';

export interface IAuthService {
  login(email: string, password: string): Promise<AuthTokens>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthTokens>;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
}

export class AuthService implements IAuthService {
  private tokenManager: TokenManager;
  private api: AuthApi;
  private currentUser: User | null = null;

  constructor(tokenManager: TokenManager, api: AuthApi) {
    this.tokenManager = tokenManager;
    this.api = api;
    this.loadCurrentUser();
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const credentials: LoginCredentials = { email, password };
      const response = await this.api.login(credentials);
      
      this.tokenManager.setTokens(response.tokens);
      this.currentUser = response.user;
      
      localStorage.setItem(STORAGE_KEYS.USER_ID, response.user.id);
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, response.user.email);
      
      return response.tokens;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('登录失败，请检查用户名和密码');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      this.tokenManager.clearTokens();
      this.currentUser = null;
      
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    try {
      const tokens = await this.api.refreshToken();
      this.tokenManager.setTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      throw new Error('Token刷新失败，请重新登录');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.tokenManager.getAccessToken() !== null && !this.tokenManager.isTokenExpired();
  }

  private async loadCurrentUser(): Promise<void> {
    const token = this.tokenManager.getAccessToken();
    if (!token) {
      return;
    }

    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      
      if (userId && userEmail) {
        this.currentUser = {
          id: userId,
          email: userEmail,
        };
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
      this.currentUser = null;
    }
  }
}