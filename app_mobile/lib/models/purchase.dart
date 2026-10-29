import '../core/json_utils.dart';

/// Compra (`GET /compras/`).
class Purchase {
  const Purchase({
    required this.id,
    required this.supplierId,
    required this.purchaseDate,
    required this.expectedDelivery,
    required this.receivedAt,
    required this.status,
  });

  final int id;
  final int? supplierId;
  final DateTime? purchaseDate;
  final DateTime? expectedDelivery;
  final DateTime? receivedAt;
  final String status;

  factory Purchase.fromJson(Map<String, dynamic> json) {
    return Purchase(
      id: asInt(json['id']) ?? 0,
      supplierId: asInt(json['fornecedor_id']),
      purchaseDate: asDateTime(json['data_compra']),
      expectedDelivery: asDateTime(json['previsao_entrega']),
      receivedAt: asDateTime(json['data_recebimento']),
      status: asString(json['status']) ?? 'PENDENTE',
    );
  }

  static List<Purchase> listFrom(Object? value) =>
      asList(value)
          .map((item) => Purchase.fromJson(asMap(item)))
          .toList(growable: false);
}
