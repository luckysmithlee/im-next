import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:logging/logging.dart';
import '../constants/api_constants.dart';
import '../models/message.dart';
import '../utils/exceptions.dart';
import 'auth_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  final AuthService _authService = AuthService();
  final Logger _logger = Logger('SocketService');

  final StreamController<Message> _messageController = StreamController<Message>.broadcast();
  final StreamController<List<String>> _onlineUsersController = StreamController<List<String>>.broadcast();
  final StreamController<Map<String, dynamic>> _unreadCountsController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Message> get onMessageReceived => _messageController.stream;
  Stream<List<String>> get onOnlineUsersUpdated => _onlineUsersController.stream;
  Stream<Map<String, dynamic>> get onUnreadCountsUpdated => _unreadCountsController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket?.connected == true) {
      _logger.info('Socket already connected');
      return;
    }

    final token = await _authService.getAccessToken();
    if (token == null) {
      throw Exception('No authentication token available');
    }

    _socket = io.io(
      ApiConstants.socketUrl,
      {
        'transports': ['websocket'],
        'autoConnect': true,
        'reconnection': true,
        'auth': {'token': token},
      },
    );

    _setupEventListeners();
    
    _socket!.connect();
    _logger.info('Socket connection initiated');
  }

  void _setupEventListeners() {
    _socket!.onConnect((_) {
      _logger.info('Socket connected');
    });

    _socket!.onDisconnect((_) {
      _logger.info('Socket disconnected');
    });

    _socket!.onConnectError((error) {
      _logger.severe('Socket connection error: $error');
    });

    _socket!.onError((error) {
      _logger.severe('Socket error: $error');
    });

    // Listen for private messages
    _socket!.on(ApiConstants.privateMessage, (data) async {
      try {
        final me = await _authService.getCurrentUser();
        final m = Map<String, dynamic>.from(data as Map);
        final from = (m['from'] ?? '') as String;
        final to = (m['to'] ?? '') as String;
        final ts = (m['timestamp'] ?? DateTime.now().millisecondsSinceEpoch) as int;
        final id = '${ts}_${from}_${to}_${(m['clientId'] ?? '')}';
        final message = Message(
          id: id,
          from: from,
          to: to,
          content: (m['content'] ?? '') as String,
          timestamp: DateTime.fromMillisecondsSinceEpoch(ts),
          clientId: m['clientId'] as String?,
          isOwn: from == me.id,
        );
        _messageController.add(message);
        _logger.info('Received private message from ${message.from}');
      } catch (e) {
        _logger.severe('Error parsing private message: $e');
      }
    });

    // Listen for online users update
    _socket!.on(ApiConstants.onlineUsers, (data) {
      try {
        final onlineUsers = List<String>.from(data as List);
        _onlineUsersController.add(onlineUsers);
        _logger.info('Online users updated: ${onlineUsers.length} users');
      } catch (e) {
        _logger.severe('Error parsing online users: $e');
      }
    });

    // Listen for unread counts update
    _socket!.on(ApiConstants.unreadCounts, (data) {
      try {
        final unreadCounts = Map<String, dynamic>.from(data as Map);
        _unreadCountsController.add(unreadCounts);
        _logger.info('Unread counts updated');
      } catch (e) {
        _logger.severe('Error parsing unread counts: $e');
      }
    });
  }

  void sendMessage(String to, String content, {String? clientId}) {
    if (!isConnected) {
      throw ChatException(
        message: 'Socket not connected',
        type: ChatErrorType.connectionFailed,
      );
    }

    final messageData = {
      'to': to,
      'content': content,
      'clientId': clientId,
    };

    _socket!.emit(ApiConstants.privateMessage, messageData);
    _logger.info('Sent private message to $to');
  }

  void markAsRead(String peer) {
    if (!isConnected) {
      _logger.warning('Cannot mark as read: Socket not connected');
      return;
    }

    _socket!.emit(ApiConstants.markRead, {'peer': peer});
    _logger.info('Marked conversation as read: $peer');
  }

  Future<void> disconnect() async {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _logger.info('Socket disconnected and disposed');
    }
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _onlineUsersController.close();
    _unreadCountsController.close();
  }
}
