import 'package:flutter/material.dart';
import '../services/secure_storage_service.dart';

class ThemeProvider with ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  bool _isLoading = true;

  ThemeMode get themeMode => _themeMode;
  bool get isLoading => _isLoading;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    try {
      final secureStorage = SecureStorageService();
      final themeString = await secureStorage.getValue('selected_theme');
      
      if (themeString != null) {
        switch (themeString) {
          case 'light':
            _themeMode = ThemeMode.light;
            break;
          case 'dark':
            _themeMode = ThemeMode.dark;
            break;
          case 'system':
          default:
            _themeMode = ThemeMode.system;
            break;
        }
      }
    } catch (e) {
      // If there's an error loading theme, keep system default
      debugPrint('Error loading theme: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    
    _themeMode = mode;
    notifyListeners();
    
    try {
      final secureStorage = SecureStorageService();
      String themeString;
      switch (mode) {
        case ThemeMode.light:
          themeString = 'light';
          break;
        case ThemeMode.dark:
          themeString = 'dark';
          break;
        case ThemeMode.system:
          themeString = 'system';
          break;
      }
      await secureStorage.setValue('selected_theme', themeString);
    } catch (e) {
      debugPrint('Error saving theme: $e');
    }
  }

  Future<void> toggleTheme() async {
    switch (_themeMode) {
      case ThemeMode.light:
        await setThemeMode(ThemeMode.dark);
        break;
      case ThemeMode.dark:
        await setThemeMode(ThemeMode.system);
        break;
      case ThemeMode.system:
        await setThemeMode(ThemeMode.light);
        break;
    }
  }

  bool get isDarkMode {
    if (_themeMode == ThemeMode.system) {
      return WidgetsBinding.instance.platformDispatcher.platformBrightness == 
             Brightness.dark;
    }
    return _themeMode == ThemeMode.dark;
  }
}