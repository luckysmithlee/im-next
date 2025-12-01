import type { ApiResponse, ApiError, HttpRequestConfig } from '@/types';
import { getBackendBase } from '@/utils';

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || getBackendBase();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async request<T>(config: HttpRequestConfig): Promise<T> {
    const {
      url,
      method = 'GET',
      headers = {},
      params,
      data,
      timeout = 6000,
      retry = 2,
    } = config;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fullUrl = this.buildUrl(url, params);
      const requestHeaders = { ...this.defaultHeaders, ...headers };

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      if (retry > 0 && error instanceof Error && error.name !== 'AbortError') {
        return this.request({ ...config, retry: retry - 1 });
      }
      throw this.handleError(error);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(url: string, params?: Record<string, any>): string {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = `${this.baseURL}/${cleanUrl}`;
    
    if (!params) return fullUrl;
    
    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.set(key, String(value));
      }
    });
    
    return urlObj.toString();
  }

  private handleError(error: any): ApiError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          message: '请求超时',
          code: 'TIMEOUT',
        };
      }
      return {
        message: error.message,
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: '未知错误',
      code: 'UNKNOWN_ERROR',
    };
  }

  async get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      headers,
    });
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      headers,
    });
  }

  async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      headers,
    });
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      headers,
    });
  }
}