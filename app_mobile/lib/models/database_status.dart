import '../core/json_utils.dart';

/// Estado do failover de banco (`GET /diagnosticos/status_banco`).
class DatabaseStatus {
  const DatabaseStatus({
    required this.activeDatabase,
    required this.primaryAvailable,
    required this.totalFailovers,
    required this.totalRecoveries,
  });

  final String activeDatabase;
  final bool primaryAvailable;
  final int totalFailovers;
  final int totalRecoveries;

  bool get usingFallback => activeDatabase.toLowerCase() != 'primary';

  factory DatabaseStatus.fromJson(Map<String, dynamic> json) {
    return DatabaseStatus(
      activeDatabase: asString(json['banco_ativo']) ?? 'desconhecido',
      primaryAvailable: asBool(json['primario_disponivel']) ?? false,
      totalFailovers: asInt(json['total_failovers']) ?? 0,
      totalRecoveries: asInt(json['total_recuperacoes']) ?? 0,
    );
  }
}
