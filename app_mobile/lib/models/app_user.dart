import '../core/json_utils.dart';

/// Usuário autenticado (`GET /auth/me`).
class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.admin,
  });

  final int id;
  final String name;
  final String email;
  final String phone;
  final bool admin;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: asInt(json['id']) ?? 0,
      name: asString(json['nome']) ?? 'Usuário',
      email: asString(json['email']) ?? '',
      phone: asString(json['telefone']) ?? '',
      admin: asBool(json['admin']) ?? false,
    );
  }
}
