export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    USER: '/api/auth/user',
  },
  CHAT: {
    MESSAGES: '/api/messages',
    CONVERSATIONS: '/api/conversations',
    READ: '/api/read',
    UNREAD: '/api/unread',
  },
  USER: {
    SEARCH: '/api/users/search',
    PROFILE: '/api/users/profile',
  },
  HEALTH: '/health',
} as const;

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  PRIVATE_MESSAGE: 'private_message',
  MARK_READ: 'mark_read',
  ONLINE_USERS: 'online_users',
  UNREAD_COUNTS: 'unread_counts',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'chat_token',
  USER_ID: 'chat_userId',
  USER_EMAIL: 'chat_userEmail',
  REMEMBER_ME: 'chat_remember_me',
  SAVED_EMAIL: 'chat_saved_email',
} as const;

export const DEFAULT_VALUES = {
  MESSAGE_LIMIT: 20,
  RETRY_ATTEMPTS: 2,
  REQUEST_TIMEOUT: 6000,
  HEALTH_CHECK_TIMEOUT: 3000,
  MAX_TOKEN_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;