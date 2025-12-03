import 'package:logging/logging.dart';
import '../models/user.dart';
import '../models/conversation.dart';
import '../constants/api_constants.dart';
import '../utils/exceptions.dart';
import 'http_client_service.dart';

class UserService {
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  final HttpClientService _httpClient = HttpClientService();
  final Logger _logger = Logger('UserService');

  Future<List<User>> searchUsers(
    String query, {
    int page = 1,
    int pageSize = ApiConstants.defaultPageSize,
  }) async {
    try {
      _logger.info('Searching users with query: $query');
      
      final response = await _httpClient.get<Map<String, dynamic>>(
        ApiConstants.searchUsers,
        queryParameters: {
          'q': query,
          'page': page,
          'pageSize': pageSize,
        },
      );

      final usersData = response.data!['users'] as List;
      final users = usersData
          .map((user) => User.fromJson(user as Map<String, dynamic>))
          .toList();

      _logger.info('Found ${users.length} users matching "$query"');
      return users;
    } on NetworkException catch (e) {
      _logger.severe('User search failed: ${e.message}');
      throw NetworkException(
        statusCode: e.statusCode,
        message: 'Failed to search users: ${e.message}',
        data: e.data,
      );
    } catch (e) {
      _logger.severe('User search error: $e');
      throw NetworkException(
        message: 'Failed to search users: ${e.toString()}',
      );
    }
  }

  Future<List<Conversation>> getConversations() async {
    try {
      _logger.info('Fetching conversations');
      
      final response = await _httpClient.get<Map<String, dynamic>>(
        ApiConstants.conversations,
      );

      final conversationsData = response.data!['conversations'] as List;
      final conversations = conversationsData
          .map((conv) => Conversation.fromJson(conv as Map<String, dynamic>))
          .toList();

      _logger.info('Fetched ${conversations.length} conversations');
      return conversations;
    } on NetworkException catch (e) {
      _logger.severe('Failed to fetch conversations: ${e.message}');
      throw NetworkException(
        statusCode: e.statusCode,
        message: 'Failed to fetch conversations: ${e.message}',
        data: e.data,
      );
    } catch (e) {
      _logger.severe('Failed to fetch conversations: $e');
      throw NetworkException(
        message: 'Failed to fetch conversations: ${e.toString()}',
      );
    }
  }

  Future<void> deleteConversation(String peer) async {
    try {
      _logger.info('Deleting conversation: $peer');
      
      await _httpClient.delete('${ApiConstants.conversations}/$peer');
      
      _logger.info('Conversation deleted: $peer');
    } on NetworkException catch (e) {
      _logger.severe('Failed to delete conversation: ${e.message}');
      throw NetworkException(
        statusCode: e.statusCode,
        message: 'Failed to delete conversation: ${e.message}',
        data: e.data,
      );
    } catch (e) {
      _logger.severe('Failed to delete conversation: $e');
      throw NetworkException(
        message: 'Failed to delete conversation: ${e.toString()}',
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
    } on NetworkException catch (e) {
      _logger.severe('Failed to ${pinned ? "pin" : "unpin"} conversation: ${e.message}');
      throw NetworkException(
        statusCode: e.statusCode,
        message: 'Failed to ${pinned ? "pin" : "unpin"} conversation: ${e.message}',
        data: e.data,
      );
    } catch (e) {
      _logger.severe('Failed to ${pinned ? "pin" : "unpin"} conversation: $e');
      throw NetworkException(
        message: 'Failed to ${pinned ? "pin" : "unpin"} conversation: ${e.toString()}',
      );
    }
  }
}