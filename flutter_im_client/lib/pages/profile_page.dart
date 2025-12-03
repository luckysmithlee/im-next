import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_bar_widget.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  Future<void> _handleLogout(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await authProvider.logout();
        if (context.mounted) {
          context.go('/login');
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Logout failed: ${e.toString()}'),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUser = authProvider.currentUser;

    return Scaffold(
      appBar: const AppBarWidget(
        title: 'Profile',
        showBackButton: true,
      ),
      body: currentUser == null
          ? const Center(
              child: Text('No user information available'),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // User Info Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          // Avatar
                          CircleAvatar(
                            radius: 48,
                            backgroundColor: Theme.of(context).colorScheme.primary,
                            child: Text(
                              currentUser.nickname?.isNotEmpty == true
                                  ? currentUser.nickname![0].toUpperCase()
                                  : currentUser.email[0].toUpperCase(),
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).colorScheme.onPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Name
                          Text(
                            currentUser.nickname ?? 'Unknown User',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 8),
                          
                          // Email
                          Text(
                            currentUser.email,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.7),
                                ),
                          ),
                          
                          // Pinyin if available
                          if (currentUser.nicknamePinyin != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              currentUser.nicknamePinyin!,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurface
                                        .withValues(alpha: 0.6),
                                  ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Settings Section
                  Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                          child: Text(
                            'Settings',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                        
                        // Theme Settings
                        ListTile(
                          leading: const Icon(Icons.palette_outlined),
                          title: const Text('Theme'),
                          subtitle: const Text('Light/Dark mode'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            // Theme selection could be implemented here
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Theme settings coming soon'),
                              ),
                            );
                          },
                        ),
                        
                        // Notifications
                        ListTile(
                          leading: const Icon(Icons.notifications_outlined),
                          title: const Text('Notifications'),
                          subtitle: const Text('Message notifications'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Notification settings coming soon'),
                              ),
                            );
                          },
                        ),
                        
                        // Privacy
                        ListTile(
                          leading: const Icon(Icons.privacy_tip_outlined),
                          title: const Text('Privacy'),
                          subtitle: const Text('Privacy settings'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Privacy settings coming soon'),
                              ),
                            );
                          },
                        ),
                        
                        // Help
                        ListTile(
                          leading: const Icon(Icons.help_outline),
                          title: const Text('Help & Support'),
                          subtitle: const Text('Get help'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Help & Support coming soon'),
                              ),
                            );
                          },
                        ),
                      ],
                      
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Account Section
                  Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                          child: Text(
                            'Account',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                        
                        // Change Password
                        ListTile(
                          leading: const Icon(Icons.lock_outline),
                          title: const Text('Change Password'),
                          subtitle: const Text('Update your password'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Password change coming soon'),
                              ),
                            );
                          },
                        ),
                        
                        // Logout
                        ListTile(
                          leading: Icon(
                            Icons.logout,
                            color: Theme.of(context).colorScheme.error,
                          ),
                          title: Text(
                            'Logout',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                          subtitle: const Text('Sign out of your account'),
                          onTap: () => _handleLogout(context),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // App Info
                  Center(
                    child: Column(
                      children: [
                        Text(
                          'Flutter IM Client',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withValues(alpha: 0.6),
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Version 1.0.0',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withValues(alpha: 0.4),
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}