import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/message.dart';
import '../models/conversation.dart';
import '../services/chat_service.dart';
import '../services/service_locator.dart';

class ChatProvider extends ChangeNotifier {
  final ChatService _chatService = chatService;

  List<Conversation> _conversations = [];
  List<Message> _currentMessages = [];
  String? _activePeer;
  bool _isLoading = false;
  String? _error;
  bool _isConnected = false;

  List<Conversation> get conversations => _conversations;
  List<Message> get currentMessages => _currentMessages;
  String? get activePeer => _activePeer;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isConnected => _isConnected;

  StreamSubscription<Message>? _messageSubscription;
  StreamSubscription<List<String>>? _onlineUsersSubscription;
  StreamSubscription<Map<String, dynamic>>? _unreadCountsSubscription;

  ChatProvider() {
    _init();
  }

  Future<void> _init() async {
    try {
      final token = await authService.getAccessToken();
      if (token == null) {
        return;
      }
      await connect();
      await loadConversations();
    } catch (e) {
      _setError('Failed to initialize chat: ${e.toString()}');
    }
  }

  Future<void> connect() async {
    try {
      await _chatService.connect();
      _isConnected = true;
      _setupListeners();
      notifyListeners();
    } catch (e) {
      _setError('Failed to connect to chat server: ${e.toString()}');
      // Do not rethrow to avoid crashing UI
    }
  }

  void _setupListeners() {
    _messageSubscription = _chatService.onMessageReceived.listen((message) {
      _handleNewMessage(message);
    });

    _onlineUsersSubscription = _chatService.onOnlineUsersUpdated.listen((onlineUsers) {
      // Handle online users update
      notifyListeners();
    });

    _unreadCountsSubscription = _chatService.onUnreadCountsUpdated.listen((unreadCounts) {
      // Handle unread counts update
      notifyListeners();
    });
  }

  void _handleNewMessage(Message message) {
    // Add message to current conversation if it's the active one
    if (_activePeer != null && 
        (message.from == _activePeer || message.to == _activePeer)) {
      _currentMessages = [..._currentMessages, message];
      notifyListeners();
    }

    // Update conversation list
    _updateConversationWithMessage(message);
  }

  void _updateConversationWithMessage(Message message) {
    final existingIndex = _conversations.indexWhere(
      (conv) => conv.peerId == message.from || conv.peerId == message.to,
    );

    if (existingIndex != -1) {
      final existing = _conversations[existingIndex];
      final updated = Conversation(
        peerId: existing.peerId,
        peerNickname: existing.peerNickname,
        peerAvatar: existing.peerAvatar,
        lastActive: DateTime.now(),
        lastTs: message.timestamp,
        unread: existing.unread + (message.isOwn ? 0 : 1),
        pinned: existing.pinned,
        pinnedAt: existing.pinnedAt,
        lastMessage: message.content,
      );
      
      _conversations[existingIndex] = updated;
      // Sort conversations by last activity
      _conversations.sort((a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastTs ?? b.lastActive).compareTo(a.lastTs ?? a.lastActive);
      });
      
      notifyListeners();
    }
  }

  Future<void> loadConversations() async {
    _setLoading(true);
    _setError(null);

    try {
      if (!_isConnected) {
        await connect();
      }
      _conversations = await _chatService.getConversations();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load conversations: ${e.toString()}');
      // Do not rethrow to avoid crashing UI
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMessages(String peer) async {
    _setLoading(true);
    _setError(null);
    _activePeer = peer;

    try {
      _currentMessages = await _chatService.getMessageHistory(peer);
      
      // Mark as read when loading messages
      await markAsRead(peer);
      
      notifyListeners();
    } catch (e) {
      _setError('Failed to load messages: ${e.toString()}');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> sendMessage(String content) async {
    if (_activePeer == null) {
      _setError('No active conversation');
      return;
    }

    try {
      _chatService.sendMessage(_activePeer!, content);
      
      // Add message to local list (optimistic update)
      final optimisticMessage = Message(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        from: '', // Will be filled by server
        to: _activePeer!,
        content: content,
        timestamp: DateTime.now(),
        clientId: DateTime.now().millisecondsSinceEpoch.toString(),
        isOwn: true,
      );
      
      _currentMessages = [..._currentMessages, optimisticMessage];
      notifyListeners();
    } catch (e) {
      _setError('Failed to send message: ${e.toString()}');
      rethrow;
    }
  }

  Future<void> markAsRead(String peer) async {
    try {
      await _chatService.markAsRead(peer);
      
      // Update local unread count
      final index = _conversations.indexWhere((conv) => conv.peerId == peer);
      if (index != -1) {
        final updated = Conversation(
          peerId: _conversations[index].peerId,
          peerNickname: _conversations[index].peerNickname,
          peerAvatar: _conversations[index].peerAvatar,
          lastActive: _conversations[index].lastActive,
          lastTs: _conversations[index].lastTs,
          unread: 0,
          pinned: _conversations[index].pinned,
          pinnedAt: _conversations[index].pinnedAt,
          lastMessage: _conversations[index].lastMessage,
        );
        _conversations[index] = updated;
        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to mark as read: ${e.toString()}');
    }
  }

  Future<void> deleteConversation(String peer) async {
    _setLoading(true);
    _setError(null);

    try {
      await _chatService.deleteConversation(peer);
      
      // Remove from local list
      _conversations.removeWhere((conv) => conv.peerId == peer);
      
      // Clear current messages if it's the active conversation
      if (_activePeer == peer) {
        _currentMessages = [];
        _activePeer = null;
      }
      
      notifyListeners();
    } catch (e) {
      _setError('Failed to delete conversation: ${e.toString()}');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> pinConversation(String peer, bool pinned) async {
    try {
      await _chatService.pinConversation(peer, pinned);
      
      // Update local conversation
      final index = _conversations.indexWhere((conv) => conv.peerId == peer);
      if (index != -1) {
        final updated = Conversation(
          peerId: _conversations[index].peerId,
          peerNickname: _conversations[index].peerNickname,
          peerAvatar: _conversations[index].peerAvatar,
          lastActive: _conversations[index].lastActive,
          lastTs: _conversations[index].lastTs,
          unread: _conversations[index].unread,
          pinned: pinned,
          pinnedAt: pinned ? DateTime.now() : null,
          lastMessage: _conversations[index].lastMessage,
        );
        _conversations[index] = updated;
        
        // Re-sort conversations
        _conversations.sort((a, b) {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return (b.lastTs ?? b.lastActive).compareTo(a.lastTs ?? a.lastActive);
        });
        
        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to ${pinned ? "pin" : "unpin"} conversation: ${e.toString()}');
    }
  }

  void setActivePeer(String? peer) {
    _activePeer = peer;
    if (peer != null) {
      loadMessages(peer);
    } else {
      _currentMessages = [];
    }
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

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _onlineUsersSubscription?.cancel();
    _unreadCountsSubscription?.cancel();
    super.dispose();
  }
}
