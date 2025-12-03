import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/user_service.dart';
import '../services/service_locator.dart';
import '../utils/exceptions.dart';

class UserProvider extends ChangeNotifier {
  final UserService _userService = userService;

  List<User> _searchResults = [];
  bool _isLoading = false;
  String? _error;

  List<User> get searchResults => _searchResults;
  bool get isLoading => _isLoading;
  String? get error => _error;

  UserProvider();

  Future<void> searchUsers(String query) async {
    if (query.trim().isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }

    _setLoading(true);
    _setError(null);

    try {
      _searchResults = await _userService.searchUsers(query);
      notifyListeners();
    } on NetworkException catch (e) {
      _setError('Failed to search users: ${e.message}');
      rethrow;
    } catch (e) {
      _setError('Failed to search users: ${e.toString()}');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  void clearSearchResults() {
    _searchResults = [];
    _setError(null);
    notifyListeners();
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