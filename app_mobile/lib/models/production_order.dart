import '../core/json_utils.dart';

/// Ordem de produção (`GET /ordens-producao/`).
class ProductionOrder {
  const ProductionOrder({
    required this.id,
    required this.orderId,
    required this.start,
    required this.end,
    required this.status,
  });

  final int id;
  final int? orderId;
  final DateTime? start;
  final DateTime? end;
  final String status;

  factory ProductionOrder.fromJson(Map<String, dynamic> json) {
    return ProductionOrder(
      id: asInt(json['id']) ?? 0,
      orderId: asInt(json['pedido_id']),
      start: asDateTime(json['data_inicio']),
      end: asDateTime(json['data_fim']),
      status: asString(json['status']) ?? 'PENDENTE',
    );
  }

  static List<ProductionOrder> listFrom(Object? value) =>
      asList(value)
          .map((item) => ProductionOrder.fromJson(asMap(item)))
          .toList(growable: false);
}
