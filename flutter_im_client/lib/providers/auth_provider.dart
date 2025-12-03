import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/service_locator.dart';
import '../utils/exceptions.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = authService;

  User? _currentUser;
  bool _isLoading = false;
  String? _error;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    await _authService.init();
    final remember = await secureStorage.getRememberMe();
    if (remember) {
      await checkAuthStatus();
    } else {
      _currentUser = null;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _setLoading(true);
    _setError(null);

    try {
      final authResponse = await _authService.login(email, password);
      _currentUser = authResponse.user;
      _setError(null);
      notifyListeners();
    } on AuthException catch (e) {
      _setError(e.message);
      rethrow;
    } catch (e) {
      _setError('Login failed: ${e.toString()}');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _setLoading(true);
    _setError(null);

    try {
      await _authService.logout();
      _currentUser = null;
      notifyListeners();
    } catch (e) {
      _setError('Logout failed: ${e.toString()}');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> checkAuthStatus() async {
    _setLoading(true);
    _setError(null);

    try {
      final isAuth = await _authService.checkAuthentication();
      if (isAuth) {
        _currentUser = await _authService.getCurrentUser();
      } else {
        _currentUser = null;
      }
      notifyListeners();
    } catch (e) {
      _currentUser = null;
      _setError('Authentication check failed: ${e.toString()}');
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refreshToken() async {
    try {
      await _authService.refreshToken();
    } catch (e) {
      _setError('Token refresh failed: ${e.toString()}');
      rethrow;
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _setError(null);
  }
}
