import 'package:dio/dio.dart';
import 'package:logging/logging.dart';
import '../constants/api_constants.dart';
import '../utils/exceptions.dart';
import 'secure_storage_service.dart';

class HttpClientService {
  static final HttpClientService _instance = HttpClientService._internal();
  factory HttpClientService() => _instance;
  HttpClientService._internal();

  final Dio _dio = Dio();
  final SecureStorageService _storage = SecureStorageService();
  final Logger _logger = Logger('HttpClientService');
  bool _initialized = false;

  Dio get dio => _dio;

  Future<void> init() async {
    if (_initialized) return;
    _dio.options = BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(milliseconds: ApiConstants.connectTimeout),
      receiveTimeout: const Duration(milliseconds: ApiConstants.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    // Add interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token if available
          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          _logger.info('Request: ${options.method} ${options.uri}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          _logger.info('Response: ${response.statusCode} ${response.requestOptions.uri}');
          return handler.next(response);
        },
        onError: (error, handler) async {
          _logger.severe('Error: ${error.message} ${error.requestOptions.uri}');
          
          if (error.response?.statusCode == 401) {
            // Handle token expiration
            await _storage.deleteToken();
            // Could implement token refresh logic here
          }
          
          return handler.next(error);
        },
      ),
    );

    // Add retry interceptor
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired, try to refresh
            try {
              await refreshToken();
              
              // Retry the original request
              final options = error.requestOptions;
              final token = await _storage.getToken();
              options.headers['Authorization'] = 'Bearer $token';
              
              final response = await _dio.fetch(options);
              return handler.resolve(response);
            } catch (e) {
              // Refresh failed, clear tokens and redirect to login
              await _storage.clearAll();
              return handler.reject(error);
            }
          }
          return handler.reject(error);
        },
      ),
    );
    _initialized = true;
  }

  Future<void> refreshToken() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null) {
      throw AuthException(
        message: 'No refresh token available',
        type: AuthErrorType.tokenExpired,
      );
    }

    try {
      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refresh_token': refreshToken},
      );

      final newToken = response.data['token'] as String;
      final newRefreshToken = response.data['refresh_token'] as String;

      await _storage.saveToken(newToken);
      await _storage.saveRefreshToken(newRefreshToken);
    } catch (e) {
      throw AuthException(
        message: 'Token refresh failed',
        type: AuthErrorType.tokenExpired,
      );
    }
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      if (!_initialized) await init();
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Options? options,
  }) async {
    try {
      if (!_initialized) await init();
      return await _dio.post<T>(
        path,
        data: data,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Options? options,
  }) async {
    try {
      if (!_initialized) await init();
      return await _dio.put<T>(
        path,
        data: data,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Options? options,
  }) async {
    try {
      if (!_initialized) await init();
      return await _dio.delete<T>(
        path,
        data: data,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  NetworkException _handleDioError(DioException error) {
    String message = 'Network error occurred';
    int? statusCode = error.response?.statusCode;

    if (error.type == DioExceptionType.connectionTimeout) {
      message = 'Connection timeout';
    } else if (error.type == DioExceptionType.receiveTimeout) {
      message = 'Receive timeout';
    } else if (error.type == DioExceptionType.badResponse) {
      message = 'Server error: ${error.response?.statusMessage}';
    } else if (error.type == DioExceptionType.cancel) {
      message = 'Request cancelled';
    } else if (error.type == DioExceptionType.unknown) {
      message = 'Unknown network error';
    }

    return NetworkException(
      statusCode: statusCode,
      message: message,
      data: error.response?.data,
    );
  }
}
