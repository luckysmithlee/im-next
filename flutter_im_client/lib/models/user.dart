import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:hive/hive.dart';

part 'user.g.dart';

@JsonSerializable()
@HiveType(typeId: 1)
class User extends Equatable {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String email;
  @HiveField(2)
  final String? nickname;
  @HiveField(3)
  final String? avatar;
  @JsonKey(name: 'nickname_pinyin')
  @HiveField(4)
  final String? nicknamePinyin;

  const User({
    required this.id,
    required this.email,
    this.nickname,
    this.avatar,
    this.nicknamePinyin,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  @override
  List<Object?> get props => [id, email, nickname, avatar, nicknamePinyin];
}