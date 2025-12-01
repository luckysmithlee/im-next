import type { UserSearchResult } from '@/types';
import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from '@/utils';

export class UserApi {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async searchUsers(query: string): Promise<UserSearchResult> {
    return this.httpClient.get(API_ENDPOINTS.USER.SEARCH, { query });
  }
}