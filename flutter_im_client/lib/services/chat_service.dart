import 'dart:async';
import 'package:logging/logging.dart';
import '../models/message.dart';
import '../models/conversation.dart';
import '../constants/api_constants.dart';
import '../utils/exceptions.dart';
import 'http_client_service.dart';
import 'socket_service.dart';
import 'auth_service.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  final HttpClientService _httpClient = HttpClientService();
  final SocketService _socketService = SocketService();
  final AuthService _authService = AuthService();
  final Logger _logger = Logger('ChatService');

  Stream<Message> get onMessageReceived => _socketService.onMessageReceived;
  Stream<List<String>> get onOnlineUsersUpdated => _socketService.onOnlineUsersUpdated;
  Stream<Map<String, dynamic>> get onUnreadCountsUpdated => _socketService.onUnreadCountsUpdated;

  bool get isConnected => _socketService.isConnected;

  Future<void> connect() async {
    try {
      await _socketService.connect();
      _logger.info('Chat service connected');
    } catch (e) {
      _logger.severe('Failed to connect chat service: $e');
      throw ChatException(
        message: 'Failed to connect to chat server',
        type: ChatErrorType.connectionFailed,
      );
    }
  }

  Future<void> disconnect() async {
    await _socketService.disconnect();
    _logger.info('Chat service disconnected');
  }

  void sendMessage(String to, String content) {
    try {
      _socketService.sendMessage(to, content);
      _logger.info('Message sent to $to');
    } catch (e) {
      _logger.severe('Failed to send message: $e');
      throw ChatException(
        message: 'Failed to send message',
        type: ChatErrorType.messageSendFailed,
      );
    }
  }

  Future<List<Message>> getMessageHistory(
    String peer, {
    int? before,
    int limit = ApiConstants.defaultPageSize,
  }) async {
    try {
      _logger.info('Fetching message history for peer: $peer');
      
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      
      if (before != null) {
        queryParams['before'] = before;
      }

      final response = await _httpClient.get<Map<String, dynamic>>(
        '${ApiConstants.messages}/$peer',
        queryParameters: queryParams,
      );

      final me = await _authService.getCurrentUser();
      final messagesData = response.data!['messages'] as List;
      final messages = messagesData.map((raw) {
        final m = raw as Map<String, dynamic>;
        final from = (m['from'] ?? '') as String;
        final to = (m['to'] ?? '') as String;
        final ts = (m['timestamp'] ?? DateTime.now().millisecondsSinceEpoch) as int;
        final id = '${ts}_${from}_${to}_${(m['clientId'] ?? '')}';
        return Message(
          id: id,
          from: from,
          to: to,
          content: (m['content'] ?? '') as String,
          timestamp: DateTime.fromMillisecondsSinceEpoch(ts),
          clientId: m['clientId'] as String?,
          isOwn: from == me.id,
        );
      }).toList();

      _logger.info('Fetched ${messages.length} messages for peer: $peer');
      return messages;
    } catch (e) {
      _logger.severe('Failed to fetch message history: $e');
      throw ChatException(
        message: 'Failed to load message history',
        type: ChatErrorType.historyLoadFailed,
      );
    }
  }

  Future<void> markAsRead(String peer) async {
    try {
      _socketService.markAsRead(peer);
      
      // Also update via REST API as backup
      await _httpClient.post('${ApiConstants.read}/$peer');
      
      _logger.info('Marked conversation as read: $peer');
    } catch (e) {
      _logger.warning('Failed to mark as read: $e');
      // Don't throw error for mark as read failures
    }
  }

  Future<List<Conversation>> getConversations() async {
    try {
      _logger.info('Fetching conversations');
      
      final response = await _httpClient.get<Map<String, dynamic>>(
        ApiConstants.conversations,
      );

      final conversationsData = response.data!['conversations'] as List;
      final conversations = conversationsData.map((raw) {
        final c = raw as Map<String, dynamic>;
        final peer = (c['peer'] ?? '') as String;
        final lastActive = (c['lastActive'] ?? 0) as int;
        final lastTs = (c['lastTs'] ?? 0) as int;
        final pinnedAt = (c['pinnedAt'] ?? 0) as int;
        return Conversation(
          peerId: peer,
          peerNickname: peer,
          peerAvatar: null,
          lastActive: DateTime.fromMillisecondsSinceEpoch(lastActive),
          lastTs: lastTs > 0 ? DateTime.fromMillisecondsSinceEpoch(lastTs) : null,
          unread: (c['unread'] ?? 0) as int,
          pinned: (c['pinned'] ?? false) as bool,
          pinnedAt: pinnedAt > 0 ? DateTime.fromMillisecondsSinceEpoch(pinnedAt) : null,
          lastMessage: c['lastMessage'] as String?,
        );
      }).toList();

      _logger.info('Fetched ${conversations.length} conversations');
      return conversations;
    } catch (e) {
      _logger.severe('Failed to fetch conversations: $e');
      throw ChatException(
        message: 'Failed to load conversations',
        type: ChatErrorType.historyLoadFailed,
      );
    }
  }

  Future<void> deleteConversation(String peer) async {
    try {
      _logger.info('Deleting conversation: $peer');
      
      await _httpClient.delete('${ApiConstants.conversations}/$peer');
      
      _logger.info('Conversation deleted: $peer');
    } catch (e) {
      _logger.severe('Failed to delete conversation: $e');
      throw ChatException(
        message: 'Failed to delete conversation',
        type: ChatErrorType.networkError,
      );
    }
  }

  Future<void> pinConversation(String peer, bool pinned) async {
    try {
      _logger.info('${pinned ? "Pinning" : "Unpinning"} conversation: $peer');
      
      await _httpClient.post(
        '${ApiConstants.conversations}/$peer/pin',
        data: {'pinned': pinned},
      );
      
      _logger.info('Conversation ${pinned ? "pinned" : "unpinned"}: $peer');
    } catch (e) {
      _logger.severe('Failed to ${pinned ? "pin" : "unpin"} conversation: $e');
      throw ChatException(
        message: 'Failed to ${pinned ? "pin" : "unpin"} conversation',
        type: ChatErrorType.networkError,
      );
    }
  }

  void dispose() {
    _socketService.dispose();
  }
}
