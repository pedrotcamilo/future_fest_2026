/// Cálculos puros usados por cards e gráficos (testáveis sem UI).
library;

import '../models/alert_item.dart';
import '../models/dashboard.dart';
import '../models/forecast_item.dart';
import '../models/material_item.dart';
import '../models/stock_item.dart';
import '../models/stock_movement.dart';
import 'formatters.dart';

class ChartPoint {
  const ChartPoint({required this.label, required this.value});

  final String label;
  final double value;
}

class MovementPoint {
  const MovementPoint({
    required this.label,
    required this.entries,
    required this.exits,
  });

  final String label;
  final double entries;
  final double exits;
}

class StatusSlice {
  const StatusSlice({required this.label, required this.value});

  final String label;
  final double value;
}

String monthKey(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}';

String _keyFromMaterialMonth(String value) {
  // A API usa YYYY-MM; datas completas também são toleradas.
  if (value.length > 7) return value.substring(0, 7);
  return value;
}

/// Soma do consumo mensal de todas as matérias-primas (últimos meses).
List<ChartPoint> aggregateMonthlyConsumption(List<MaterialItem> materials) {
  final totals = <String, double>{};
  for (final material in materials) {
    for (final entry in material.monthlyConsumption) {
      final key = _keyFromMaterialMonth(entry.month);
      if (key.isEmpty) continue;
      totals[key] = (totals[key] ?? 0) + entry.consumption;
    }
  }
  final keys = totals.keys.toList()..sort();
  return [
    for (final key in keys)
      ChartPoint(label: monthLabel(key), value: totals[key]!),
  ];
}

/// Consumo mensal de uma matéria-prima específica.
List<ChartPoint> monthlyConsumptionForMaterial(MaterialItem material) {
  final entries = [...material.monthlyConsumption]
    ..sort((a, b) => a.month.compareTo(b.month));
  return [
    for (final entry in entries)
      ChartPoint(label: monthLabel(entry.month), value: entry.consumption),
  ];
}

/// Maiores saldos, em ordem decrescente.
List<ChartPoint> stockLevels(List<StockRow> rows, {int limit = 8}) {
  final sorted = [...rows]..sort((a, b) => b.quantity.compareTo(a.quantity));
  return [
    for (final row in sorted.take(limit))
      ChartPoint(label: shortName(row.material.name), value: row.quantity),
  ];
}

/// Itens abaixo do estoque mínimo, do mais crítico para o menos crítico.
List<StockRow> lowStockRows(List<StockRow> rows) {
  final filtered = rows.where((row) => row.belowMinimum).toList()
    ..sort((a, b) {
      final ratioA = a.minimumRatio ?? double.infinity;
      final ratioB = b.minimumRatio ?? double.infinity;
      return ratioA.compareTo(ratioB);
    });
  return filtered;
}

/// Entradas e saídas agrupadas por mês (até [months] meses mais recentes).
List<MovementPoint> movementSeries(
  List<StockMovement> movements, {
  int months = 6,
}) {
  final grouped = <String, ({double entries, double exits})>{};
  for (final movement in movements) {
    final date = movement.date;
    if (date == null) continue;
    final key = monthKey(date);
    final current = grouped[key] ?? (entries: 0.0, exits: 0.0);
    grouped[key] = movement.isEntry
        ? (entries: current.entries + movement.quantity, exits: current.exits)
        : (entries: current.entries, exits: current.exits + movement.quantity);
  }
  final keys = grouped.keys.toList()..sort();
  final recent = keys.length > months
      ? keys.sublist(keys.length - months)
      : keys;
  return [
    for (final key in recent)
      MovementPoint(
        label: monthLabel(key),
        entries: grouped[key]!.entries,
        exits: grouped[key]!.exits,
      ),
  ];
}

/// Consumo previsto agrupado por mês de início do período.
List<ChartPoint> forecastSeries(List<ForecastItem> forecasts) {
  final grouped = <String, double>{};
  for (final forecast in forecasts) {
    final date = forecast.periodStart ?? forecast.forecastDate;
    if (date == null) continue;
    final key = monthKey(date);
    grouped[key] = (grouped[key] ?? 0) + forecast.forecastConsumption;
  }
  final keys = grouped.keys.toList()..sort();
  return [
    for (final key in keys)
      ChartPoint(label: monthLabel(key), value: grouped[key]!),
  ];
}

List<StatusSlice> purchaseStatusSlices(PurchaseSummary summary) => [
  StatusSlice(label: 'Pendentes', value: summary.pending.toDouble()),
  StatusSlice(label: 'Recebidas', value: summary.received.toDouble()),
  StatusSlice(label: 'Canceladas', value: summary.cancelled.toDouble()),
];

List<StatusSlice> productionStatusSlices(ProductionSummary summary) => [
  StatusSlice(label: 'Pendentes', value: summary.pending.toDouble()),
  StatusSlice(label: 'Em produção', value: summary.inProduction.toDouble()),
  StatusSlice(label: 'Finalizadas', value: summary.finished.toDouble()),
  StatusSlice(label: 'Canceladas', value: summary.cancelled.toDouble()),
];

List<StatusSlice> alertPrioritySlices(List<AlertItem> alerts) {
  var high = 0;
  var medium = 0;
  var low = 0;
  for (final alert in alerts) {
    switch ((alert.priority ?? '').toUpperCase()) {
      case 'ALTA':
        high++;
      case 'MEDIA':
      case 'MÉDIA':
        medium++;
      case 'BAIXA':
        low++;
    }
  }
  return [
    StatusSlice(label: 'Alta', value: high.toDouble()),
    StatusSlice(label: 'Média', value: medium.toDouble()),
    StatusSlice(label: 'Baixa', value: low.toDouble()),
  ];
}

/// Nome curto para eixos de gráficos.
String shortName(String name, {int max = 11}) {
  final trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  final firstWord = trimmed.split(' ').first;
  if (firstWord.length <= max) return firstWord;
  return '${trimmed.substring(0, max - 1)}…';
}

/// Total consolidado do saldo.
double totalStock(List<StockRow> rows) =>
    rows.fold(0, (sum, row) => sum + row.quantity);
