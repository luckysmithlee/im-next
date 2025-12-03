// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MessageAdapter extends TypeAdapter<Message> {
  @override
  final int typeId = 0;

  @override
  Message read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Message(
      id: fields[0] as String,
      from: fields[1] as String,
      to: fields[2] as String,
      content: fields[3] as String,
      timestamp: fields[4] as DateTime,
      clientId: fields[5] as String?,
      isOwn: fields[6] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, Message obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.from)
      ..writeByte(2)
      ..write(obj.to)
      ..writeByte(3)
      ..write(obj.content)
      ..writeByte(4)
      ..write(obj.timestamp)
      ..writeByte(5)
      ..write(obj.clientId)
      ..writeByte(6)
      ..write(obj.isOwn);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MessageAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Message _$MessageFromJson(Map<String, dynamic> json) => Message(
      id: json['id'] as String,
      from: json['from'] as String,
      to: json['to'] as String,
      content: json['content'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      clientId: json['client_id'] as String?,
      isOwn: json['is_own'] as bool,
    );

Map<String, dynamic> _$MessageToJson(Message instance) => <String, dynamic>{
      'id': instance.id,
      'from': instance.from,
      'to': instance.to,
      'content': instance.content,
      'timestamp': instance.timestamp.toIso8601String(),
      'client_id': instance.clientId,
      'is_own': instance.isOwn,
    };
