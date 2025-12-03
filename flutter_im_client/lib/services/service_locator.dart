import 'package:get_it/get_it.dart';
import 'auth_service.dart';
import 'chat_service.dart';
import 'user_service.dart';
import 'http_client_service.dart';
import 'secure_storage_service.dart';
import 'socket_service.dart';
import 'cache_storage_service.dart';

final GetIt serviceLocator = GetIt.instance;

void setupServiceLocator() {
  // Register services as singletons
  serviceLocator.registerSingleton<SecureStorageService>(SecureStorageService());
  serviceLocator.registerSingleton<HttpClientService>(HttpClientService());
  serviceLocator.registerSingleton<AuthService>(AuthService());
  serviceLocator.registerSingleton<SocketService>(SocketService());
  serviceLocator.registerSingleton<ChatService>(ChatService());
  serviceLocator.registerSingleton<UserService>(UserService());
  serviceLocator.registerSingleton<CacheStorageService>(CacheStorageService());
}

// Convenience getters
SecureStorageService get secureStorage => serviceLocator<SecureStorageService>();
HttpClientService get httpClient => serviceLocator<HttpClientService>();
AuthService get authService => serviceLocator<AuthService>();
SocketService get socketService => serviceLocator<SocketService>();
ChatService get chatService => serviceLocator<ChatService>();
UserService get userService => serviceLocator<UserService>();
CacheStorageService get cacheStorage => serviceLocator<CacheStorageService>();