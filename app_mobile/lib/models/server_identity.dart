import '../core/json_utils.dart';

/// Identidade do servidor AxionPhare (`GET /diagnosticos/axionphare_desktop`).
class ServerIdentity {
  const ServerIdentity({required this.name, required this.company});

  final String name;
  final String company;

  factory ServerIdentity.fromJson(Map<String, dynamic> json) {
    return ServerIdentity(
      name:
          asString(json['intendidade']) ??
          asString(json['identidade']) ??
          'AxionPhare',
      company: asString(json['empresa']) ?? '',
    );
  }

  static const ServerIdentity fallback = ServerIdentity(
    name: 'AxionPhare',
    company: 'Servidor não identificado',
  );
}
