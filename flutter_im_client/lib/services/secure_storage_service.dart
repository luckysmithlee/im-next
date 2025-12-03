import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';

class SecureStorageService {
  static final SecureStorageService _instance = SecureStorageService._internal();
  factory SecureStorageService() => _instance;
  SecureStorageService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const String _rememberKey = 'remember_me';

  Future<void> saveToken(String token) async {
    await _storage.write(key: ApiConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: ApiConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: ApiConstants.tokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: ApiConstants.refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: ApiConstants.refreshTokenKey);
  }

  Future<void> deleteRefreshToken() async {
    await _storage.delete(key: ApiConstants.refreshTokenKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<String?> getValue(String key) async {
    return await _storage.read(key: key);
  }

  Future<void> setValue(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<void> saveRememberMe(bool remember) async {
    await _storage.write(key: _rememberKey, value: remember ? '1' : '0');
  }

  Future<bool> getRememberMe() async {
    final v = await _storage.read(key: _rememberKey);
    return v == '1';
  }
}
