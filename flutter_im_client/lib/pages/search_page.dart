import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/user_provider.dart';
import '../providers/chat_provider.dart';
import '../models/user.dart';
import '../widgets/loading_widget.dart';
import '../widgets/error_widget.dart' as custom_error;
import '../widgets/app_bar_widget.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    // Load search results when page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _performSearch('');
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    
    try {
      await userProvider.searchUsers(query);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(userProvider.error ?? 'Search failed'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _startChatWithUser(User user) {
    // Set the user as active peer in chat provider
    Provider.of<ChatProvider>(context, listen: false).setActivePeer(user.id);
    
    // Navigate back to chat page
    if (mounted) {
      context.go('/chat');
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);

    return Scaffold(
      appBar: AppBarWidget(
        title: 'Search Users',
        showBackButton: true,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name, email, or pinyin...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          
          // Search Results
          Expanded(
            child: userProvider.isLoading && userProvider.searchResults.isEmpty
                ? const LoadingWidget(message: 'Searching...')
                : userProvider.error != null && userProvider.searchResults.isEmpty
                    ? custom_error.CustomErrorWidget(
                        message: userProvider.error!,
                        onRetry: () => _performSearch(_searchController.text),
                      )
                    : userProvider.searchResults.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.person_search_outlined,
                                  size: 64,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.3),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No users found',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurface
                                            .withValues(alpha: 0.6),
                                      ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Try searching with a different term',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurface
                                            .withValues(alpha: 0.6),
                                      ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            itemCount: userProvider.searchResults.length,
                            itemBuilder: (context, index) {
                              final user = userProvider.searchResults[index];
                              return _UserListItem(
                                user: user,
                                onStartChat: () => _startChatWithUser(user),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class _UserListItem extends StatelessWidget {
  final User user;
  final VoidCallback onStartChat;

  const _UserListItem({
    required this.user,
    required this.onStartChat,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).colorScheme.primary,
          child: Text(
            user.nickname?.isNotEmpty == true
                ? user.nickname![0].toUpperCase()
                : user.email[0].toUpperCase(),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onPrimary,
            ),
          ),
        ),
        title: Text(
          user.nickname ?? user.email,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user.email),
            if (user.nicknamePinyin != null) ...[
              const SizedBox(height: 2),
              Text(
                user.nicknamePinyin!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
              ),
            ],
          ],
        ),
        trailing: ElevatedButton.icon(
          onPressed: onStartChat,
          icon: const Icon(Icons.chat_bubble_outline, size: 16),
          label: const Text('Chat'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
        ),
        onTap: onStartChat,
      ),
    );
  }
}