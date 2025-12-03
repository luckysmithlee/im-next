class ApiConstants {
  static const String baseUrl = 'http://localhost:4000/api/';
  static const String socketUrl = 'http://localhost:4000';
  
  // Auth endpoints
  static const String login = 'auth/login';
  static const String refreshToken = 'auth/refresh';
  static const String logout = 'auth/logout';
  static const String me = 'me';
  
  // Chat endpoints
  static const String messages = 'messages';
  static const String conversations = 'conversations';
  static const String read = 'read';
  static const String searchUsers = 'users/search';
  
  // Socket events
  static const String privateMessage = 'private_message';
  static const String markRead = 'mark_read';
  static const String onlineUsers = 'online_users';
  static const String unreadCounts = 'unread_counts';
  
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String currentUserKey = 'current_user';
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
