import '../core/json_utils.dart';

/// Sugestão de compra (`GET /sugestoes-compra/`).
class PurchaseSuggestion {
  const PurchaseSuggestion({
    required this.id,
    required this.materialId,
    required this.date,
    required this.suggestedQuantity,
    required this.reason,
    required this.status,
  });

  final int id;
  final int? materialId;
  final DateTime? date;
  final double suggestedQuantity;
  final String? reason;
  final String status;

  bool get isPending => status.toUpperCase() == 'PENDENTE';

  factory PurchaseSuggestion.fromJson(Map<String, dynamic> json) {
    return PurchaseSuggestion(
      id: asInt(json['id']) ?? 0,
      materialId: asInt(json['materia_prima_id']),
      date: asDateTime(json['data_sugestao']),
      suggestedQuantity: asDouble(json['quantidade_sugerida']) ?? 0,
      reason: asString(json['motivo']),
      status: asString(json['status']) ?? 'PENDENTE',
    );
  }

  static List<PurchaseSuggestion> listFrom(Object? value) =>
      asList(value)
          .map((item) => PurchaseSuggestion.fromJson(asMap(item)))
          .toList(growable: false);
}
