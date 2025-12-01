import type { User, LoginCredentials, AuthTokens } from '@/types';
import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from '@/utils';

export class AuthApi {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    return this.httpClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async logout(): Promise<void> {
    return this.httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async refreshToken(): Promise<AuthTokens> {
    return this.httpClient.post(API_ENDPOINTS.AUTH.REFRESH);
  }

  async getCurrentUser(token: string): Promise<User> {
    return this.httpClient.get(API_ENDPOINTS.AUTH.USER, undefined, {
      'Authorization': `Bearer ${token}`,
    });
  }
}