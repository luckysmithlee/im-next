import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:hive/hive.dart';

part 'message.g.dart';

@JsonSerializable()
@HiveType(typeId: 0)
class Message extends Equatable {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String from;
  @HiveField(2)
  final String to;
  @HiveField(3)
  final String content;
  @HiveField(4)
  final DateTime timestamp;
  @JsonKey(name: 'client_id')
  @HiveField(5)
  final String? clientId;
  @JsonKey(name: 'is_own')
  @HiveField(6)
  final bool isOwn;

  const Message({
    required this.id,
    required this.from,
    required this.to,
    required this.content,
    required this.timestamp,
    this.clientId,
    required this.isOwn,
  });

  factory Message.fromJson(Map<String, dynamic> json) => _$MessageFromJson(json);
  Map<String, dynamic> toJson() => _$MessageToJson(this);

  @override
  List<Object?> get props => [id, from, to, content, timestamp, clientId, isOwn];
}