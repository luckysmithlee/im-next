import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:hive/hive.dart';

part 'conversation.g.dart';

@JsonSerializable()
@HiveType(typeId: 2)
class Conversation extends Equatable {
  @JsonKey(name: 'peer_id')
  @HiveField(0)
  final String peerId;
  @JsonKey(name: 'peer_nickname')
  @HiveField(1)
  final String peerNickname;
  @JsonKey(name: 'peer_avatar')
  @HiveField(2)
  final String? peerAvatar;
  @JsonKey(name: 'last_active')
  @HiveField(3)
  final DateTime lastActive;
  @JsonKey(name: 'last_ts')
  @HiveField(4)
  final DateTime? lastTs;
  @HiveField(5)
  final int unread;
  @HiveField(6)
  final bool pinned;
  @JsonKey(name: 'pinned_at')
  @HiveField(7)
  final DateTime? pinnedAt;
  @JsonKey(name: 'last_message')
  @HiveField(8)
  final String? lastMessage;

  const Conversation({
    required this.peerId,
    required this.peerNickname,
    this.peerAvatar,
    required this.lastActive,
    this.lastTs,
    required this.unread,
    required this.pinned,
    this.pinnedAt,
    this.lastMessage,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) =>
      _$ConversationFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationToJson(this);

  @override
  List<Object?> get props => [
        peerId,
        peerNickname,
        peerAvatar,
        lastActive,
        lastTs,
        unread,
        pinned,
        pinnedAt,
        lastMessage,
      ];
}