import 'dart:io' show Platform;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  bool get _usePrefs => Platform.isMacOS || Platform.isLinux || Platform.isWindows;
  Future<SharedPreferences> get _prefs async => SharedPreferences.getInstance();

  static const String _rememberKey = 'remember_me';

  Future<void> saveToken(String token) async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.setString(ApiConstants.tokenKey, token);
      return;
    }
    await _storage.write(key: ApiConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    if (_usePrefs) {
      final p = await _prefs;
      return p.getString(ApiConstants.tokenKey);
    }
    return await _storage.read(key: ApiConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.remove(ApiConstants.tokenKey);
      return;
    }
    await _storage.delete(key: ApiConstants.tokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.setString(ApiConstants.refreshTokenKey, token);
      return;
    }
    await _storage.write(key: ApiConstants.refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    if (_usePrefs) {
      final p = await _prefs;
      return p.getString(ApiConstants.refreshTokenKey);
    }
    return await _storage.read(key: ApiConstants.refreshTokenKey);
  }

  Future<void> deleteRefreshToken() async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.remove(ApiConstants.refreshTokenKey);
      return;
    }
    await _storage.delete(key: ApiConstants.refreshTokenKey);
  }

  Future<void> clearAll() async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.remove(ApiConstants.tokenKey);
      await p.remove(ApiConstants.refreshTokenKey);
      await p.remove(_rememberKey);
      return;
    }
    await _storage.deleteAll();
  }

  Future<String?> getValue(String key) async {
    if (_usePrefs) {
      final p = await _prefs;
      return p.getString(key);
    }
    return await _storage.read(key: key);
  }

  Future<void> setValue(String key, String value) async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.setString(key, value);
      return;
    }
    await _storage.write(key: key, value: value);
  }

  Future<void> saveRememberMe(bool remember) async {
    if (_usePrefs) {
      final p = await _prefs;
      await p.setBool(_rememberKey, remember);
      return;
    }
    await _storage.write(key: _rememberKey, value: remember ? '1' : '0');
  }

  Future<bool> getRememberMe() async {
    if (_usePrefs) {
      final p = await _prefs;
      return p.getBool(_rememberKey) ?? false;
    }
    final v = await _storage.read(key: _rememberKey);
    return v == '1';
  }
}
