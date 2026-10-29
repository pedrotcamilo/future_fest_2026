import '../core/json_utils.dart';

/// Matéria-prima (`GET /materias-primas/`).
class MaterialItem {
  const MaterialItem({
    required this.id,
    required this.code,
    required this.name,
    required this.unit,
    required this.minimumStock,
    required this.maximumStock,
    required this.averageMonthlyConsumption,
    required this.active,
    required this.monthlyConsumption,
  });

  final int id;
  final String? code;
  final String name;
  final String? unit;
  final double? minimumStock;
  final double? maximumStock;
  final double? averageMonthlyConsumption;
  final bool active;
  final List<MonthlyConsumption> monthlyConsumption;

  String get displayUnit => (unit == null || unit!.isEmpty) ? '' : ' $unit';

  factory MaterialItem.fromJson(Map<String, dynamic> json) {
    return MaterialItem(
      id: asInt(json['id']) ?? 0,
      code: asString(json['codigo']),
      name: asString(json['nome']) ?? 'Matéria-prima',
      unit: asString(json['unidade']),
      minimumStock: asDouble(json['estoque_minimo']),
      maximumStock: asDouble(json['estoque_maximo']),
      averageMonthlyConsumption: asDouble(json['consumo_medio_mensal']),
      active: asBool(json['ativo']) ?? true,
      monthlyConsumption: asList(json['consumo_mensal'])
          .map((item) => MonthlyConsumption.fromJson(asMap(item)))
          .where((item) => item.month.isNotEmpty)
          .toList(growable: false),
    );
  }

  static List<MaterialItem> listFrom(Object? value) =>
      asList(value)
          .map((item) => MaterialItem.fromJson(asMap(item)))
          .toList(growable: false);
}

class MonthlyConsumption {
  const MonthlyConsumption({required this.month, required this.consumption});

  /// Formato `YYYY-MM`.
  final String month;
  final double consumption;

  factory MonthlyConsumption.fromJson(Map<String, dynamic> json) {
    return MonthlyConsumption(
      month: asString(json['mes']) ?? '',
      consumption: asDouble(json['consumo']) ?? 0,
    );
  }
}
