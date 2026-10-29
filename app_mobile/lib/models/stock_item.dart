import '../core/json_utils.dart';
import 'material_item.dart';

/// Saldo consolidado por matéria-prima (`GET /estoque/`).
class StockItem {
  const StockItem({
    required this.materialId,
    required this.name,
    required this.quantity,
  });

  final int materialId;
  final String name;
  final double quantity;

  factory StockItem.fromJson(Map<String, dynamic> json) {
    return StockItem(
      materialId: asInt(json['materia_prima_id']) ?? 0,
      name: asString(json['nome']) ?? 'Matéria-prima',
      quantity: asDouble(json['estoque']) ?? 0,
    );
  }

  static List<StockItem> listFrom(Object? value) =>
      asList(value)
          .map((item) => StockItem.fromJson(asMap(item)))
          .toList(growable: false);
}

/// Matéria-prima combinada com o saldo consolidado.
class StockRow {
  const StockRow({required this.material, required this.quantity});

  final MaterialItem material;
  final double quantity;

  double? get minimum => material.minimumStock;
  double? get maximum => material.maximumStock;

  bool get belowMinimum {
    final min = minimum;
    return min != null && min > 0 && quantity < min;
  }

  /// Percentual do estoque máximo (0..1), quando configurado.
  double? get maximumRatio {
    final max = maximum;
    if (max == null || max <= 0) return null;
    return (quantity / max).clamp(0.0, 1.0);
  }

  /// Saldo relativo ao mínimo (pode passar de 1).
  double? get minimumRatio {
    final min = minimum;
    if (min == null || min <= 0) return null;
    return quantity / min;
  }
}

/// Junta as matérias-primas com o saldo por id, preenchendo ausentes com zero.
List<StockRow> mergeStock(List<MaterialItem> materials, List<StockItem> stock) {
  final byId = {for (final item in stock) item.materialId: item.quantity};
  final rows = materials
      .map(
        (material) =>
            StockRow(material: material, quantity: byId[material.id] ?? 0),
      )
      .toList(growable: false);
  rows.sort(
    (a, b) =>
        a.material.name.toLowerCase().compareTo(b.material.name.toLowerCase()),
  );
  return rows;
}
