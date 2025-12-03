import 'package:hive_flutter/hive_flutter.dart';
import '../models/message.dart';
import '../models/user.dart';
import '../models/conversation.dart';

class CacheStorageService {
  static final CacheStorageService _instance = CacheStorageService._internal();
  factory CacheStorageService() => _instance;
  CacheStorageService._internal();

  static const String _messagesBox = 'messages';
  static const String _usersBox = 'users';
  static const String _conversationsBox = 'conversations';

  Future<void> init() async {
    await Hive.initFlutter();
    
    // Register adapters
    Hive.registerAdapter(MessageAdapter());
    Hive.registerAdapter(UserAdapter());
    Hive.registerAdapter(ConversationAdapter());
    
    // Open boxes
    await Hive.openBox<List>(_messagesBox);
    await Hive.openBox<User>(_usersBox);
    await Hive.openBox<List>(_conversationsBox);
  }

  // Message caching
  Future<void> cacheMessages(String peer, List<Message> messages) async {
    final box = Hive.box<List>(_messagesBox);
    await box.put(peer, messages);
  }

  Future<List<Message>?> getCachedMessages(String peer) async {
    final box = Hive.box<List>(_messagesBox);
    final messages = box.get(peer);
    if (messages != null) {
      return messages.cast<Message>();
    }
    return null;
  }

  // User caching
  Future<void> cacheUser(User user) async {
    final box = Hive.box<User>(_usersBox);
    await box.put(user.id, user);
  }

  Future<User?> getCachedUser(String userId) async {
    final box = Hive.box<User>(_usersBox);
    return box.get(userId);
  }

  // Conversation caching
  Future<void> cacheConversations(List<Conversation> conversations) async {
    final box = Hive.box<List>(_conversationsBox);
    await box.put('conversations', conversations);
  }

  Future<List<Conversation>?> getCachedConversations() async {
    final box = Hive.box<List>(_conversationsBox);
    final conversations = box.get('conversations');
    if (conversations != null) {
      return conversations.cast<Conversation>();
    }
    return null;
  }

  Future<void> clearAll() async {
    await Hive.box<List>(_messagesBox).clear();
    await Hive.box<User>(_usersBox).clear();
    await Hive.box<List>(_conversationsBox).clear();
  }
}