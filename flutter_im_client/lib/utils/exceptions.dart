class NetworkException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic data;

  NetworkException({this.statusCode, required this.message, this.data});

  @override
  String toString() => 'NetworkException: $message (status: $statusCode)';
}

class AuthException implements Exception {
  final String message;
  final AuthErrorType type;

  AuthException({required this.message, required this.type});

  @override
  String toString() => 'AuthException: $message (type: $type)';
}

enum AuthErrorType {
  invalidCredentials,
  tokenExpired,
  networkError,
  unknown,
}

class ChatException implements Exception {
  final String message;
  final ChatErrorType type;

  ChatException({required this.message, required this.type});

  @override
  String toString() => 'ChatException: $message (type: $type)';
}

enum ChatErrorType {
  connectionFailed,
  messageSendFailed,
  historyLoadFailed,
  networkError,
  unknown,
}