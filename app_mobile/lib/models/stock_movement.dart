import '../core/json_utils.dart';

/// Movimentação de estoque (`GET /estoque/movimentacoes`).
class StockMovement {
  const StockMovement({
    required this.id,
    required this.lotId,
    required this.type,
    required this.quantity,
    required this.date,
    required this.note,
  });

  final int id;
  final int? lotId;
  final String type;
  final double quantity;
  final DateTime? date;
  final String? note;

  bool get isEntry => type.toUpperCase() == 'ENTRADA';

  factory StockMovement.fromJson(Map<String, dynamic> json) {
    return StockMovement(
      id: asInt(json['id']) ?? 0,
      lotId: asInt(json['lote_id']),
      type: asString(json['tipo']) ?? '',
      quantity: asDouble(json['quantidade']) ?? 0,
      date: asDateTime(json['data_movimento']),
      note: asString(json['observacao']),
    );
  }

  static List<StockMovement> listFrom(Object? value) =>
      asList(value)
          .map((item) => StockMovement.fromJson(asMap(item)))
          .toList(growable: false);
}
