export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationError[];
}