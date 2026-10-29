import '../core/json_utils.dart';

/// Alerta operacional (`GET /alertas/`).
class AlertItem {
  const AlertItem({
    required this.id,
    required this.type,
    required this.materialId,
    required this.lotId,
    required this.description,
    required this.priority,
    required this.resolved,
    required this.date,
  });

  final int id;
  final String? type;
  final int? materialId;
  final int? lotId;
  final String? description;
  final String? priority;
  final bool resolved;
  final DateTime? date;

  bool get highPriority => (priority ?? '').toUpperCase() == 'ALTA';

  factory AlertItem.fromJson(Map<String, dynamic> json) {
    return AlertItem(
      id: asInt(json['id']) ?? 0,
      type: asString(json['tipo']),
      materialId: asInt(json['materia_prima_id']),
      lotId: asInt(json['lote_id']),
      description: asString(json['descricao']),
      priority: asString(json['prioridade']),
      resolved: asBool(json['resolvido']) ?? false,
      date: asDateTime(json['data_alerta']),
    );
  }

  static List<AlertItem> listFrom(Object? value) =>
      asList(value)
          .map((item) => AlertItem.fromJson(asMap(item)))
          .toList(growable: false);
}
