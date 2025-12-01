import type { AuthTokens } from '@/types';
import { STORAGE_KEYS, DEFAULT_VALUES } from '@/utils';

export class TokenManager {
  private tokens: AuthTokens | null = null;
  private listeners: Set<(tokens: AuthTokens | null) => void> = new Set();

  constructor() {
    this.loadTokens();
  }

  private loadTokens(): void {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      
      if (token && userId && userEmail) {
        const tokenParts = token.split('_');
        const tokenTimestamp = tokenParts[tokenParts.length - 1];
        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        
        if (tokenAge < DEFAULT_VALUES.MAX_TOKEN_AGE) {
          this.tokens = {
            accessToken: token,
          };
        } else {
          this.clearTokens();
        }
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
      this.clearTokens();
    }
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
    this.saveTokens();
    this.notifyListeners();
  }

  clearTokens(): void {
    this.tokens = null;
    this.removeTokens();
    this.notifyListeners();
  }

  isTokenExpired(): boolean {
    if (!this.tokens?.expiresAt) {
      return false;
    }
    return Date.now() >= this.tokens.expiresAt;
  }

  private saveTokens(): void {
    if (!this.tokens) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, this.tokens.accessToken);
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private removeTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Failed to remove tokens:', error);
    }
  }

  subscribe(listener: (tokens: AuthTokens | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.tokens));
  }
}