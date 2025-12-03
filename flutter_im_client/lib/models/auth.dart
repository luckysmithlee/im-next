import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'auth.g.dart';

@JsonSerializable()
class AuthResponse extends Equatable {
  final String token;
  @JsonKey(name: 'refresh_token')
  final String refreshToken;
  final User user;

  const AuthResponse({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);

  @override
  List<Object?> get props => [token, refreshToken, user];
}

@JsonSerializable()
class LoginRequest extends Equatable {
  final String email;
  final String password;

  const LoginRequest({
    required this.email,
    required this.password,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) =>
      _$LoginRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);

  @override
  List<Object?> get props => [email, password];
}