// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ConversationAdapter extends TypeAdapter<Conversation> {
  @override
  final int typeId = 2;

  @override
  Conversation read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Conversation(
      peerId: fields[0] as String,
      peerNickname: fields[1] as String,
      peerAvatar: fields[2] as String?,
      lastActive: fields[3] as DateTime,
      lastTs: fields[4] as DateTime?,
      unread: fields[5] as int,
      pinned: fields[6] as bool,
      pinnedAt: fields[7] as DateTime?,
      lastMessage: fields[8] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, Conversation obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.peerId)
      ..writeByte(1)
      ..write(obj.peerNickname)
      ..writeByte(2)
      ..write(obj.peerAvatar)
      ..writeByte(3)
      ..write(obj.lastActive)
      ..writeByte(4)
      ..write(obj.lastTs)
      ..writeByte(5)
      ..write(obj.unread)
      ..writeByte(6)
      ..write(obj.pinned)
      ..writeByte(7)
      ..write(obj.pinnedAt)
      ..writeByte(8)
      ..write(obj.lastMessage);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConversationAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Conversation _$ConversationFromJson(Map<String, dynamic> json) => Conversation(
      peerId: json['peer_id'] as String,
      peerNickname: json['peer_nickname'] as String,
      peerAvatar: json['peer_avatar'] as String?,
      lastActive: DateTime.parse(json['last_active'] as String),
      lastTs: json['last_ts'] == null
          ? null
          : DateTime.parse(json['last_ts'] as String),
      unread: (json['unread'] as num).toInt(),
      pinned: json['pinned'] as bool,
      pinnedAt: json['pinned_at'] == null
          ? null
          : DateTime.parse(json['pinned_at'] as String),
      lastMessage: json['last_message'] as String?,
    );

Map<String, dynamic> _$ConversationToJson(Conversation instance) =>
    <String, dynamic>{
      'peer_id': instance.peerId,
      'peer_nickname': instance.peerNickname,
      'peer_avatar': instance.peerAvatar,
      'last_active': instance.lastActive.toIso8601String(),
      'last_ts': instance.lastTs?.toIso8601String(),
      'unread': instance.unread,
      'pinned': instance.pinned,
      'pinned_at': instance.pinnedAt?.toIso8601String(),
      'last_message': instance.lastMessage,
    };
