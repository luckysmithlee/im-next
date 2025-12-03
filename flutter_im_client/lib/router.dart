import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'pages/login_page.dart';
import 'pages/chat_page.dart';
import 'pages/search_page.dart';
import 'pages/profile_page.dart';
import 'pages/settings_page.dart';
import 'pages/diagnostics_page.dart';

final router = GoRouter(
  initialLocation: '/login',
  redirect: (context, state) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isLoggedIn = authProvider.isAuthenticated;
    final isLoggingIn = state.matchedLocation == '/login';
    if (authProvider.isLoading) {
      return null;
    }
    
    if (!isLoggedIn && !isLoggingIn) {
      return '/login';
    }
    
    if (isLoggedIn && isLoggingIn) {
      return '/chat';
    }
    
    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) => const ChatPage(),
      routes: [
        GoRoute(
          path: 'search',
          builder: (context, state) => const SearchPage(),
        ),
        GoRoute(
          path: 'profile',
          builder: (context, state) => const ProfilePage(),
        ),
        GoRoute(
          path: 'settings',
          builder: (context, state) => const SettingsPage(),
        ),
        GoRoute(
          path: 'diagnostics',
          builder: (context, state) => const DiagnosticsPage(),
        ),
      ],
    ),
  ],
);
