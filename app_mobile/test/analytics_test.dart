import 'package:axionphare_glance/core/analytics.dart';
import 'package:axionphare_glance/core/formatters.dart';
import 'package:axionphare_glance/models/alert_item.dart';
import 'package:axionphare_glance/models/dashboard.dart';
import 'package:axionphare_glance/models/forecast_item.dart';
import 'package:axionphare_glance/models/material_item.dart';
import 'package:axionphare_glance/models/stock_item.dart';
import 'package:axionphare_glance/models/stock_movement.dart';
import 'package:flutter_test/flutter_test.dart';

MaterialItem material({
  int id = 1,
  String name = 'Omeprazol',
  double min = 500,
  double max = 4000,
  List<MonthlyConsumption> consumption = const [],
}) {
  return MaterialItem(
    id: id,
    code: 'MP-$id',
    name: name,
    unit: 'g',
    minimumStock: min,
    maximumStock: max,
    averageMonthlyConsumption: 200,
    active: true,
    monthlyConsumption: consumption,
  );
}

void main() {
  group('formatters', () {
    test('quantidades usam separador pt-BR', () {
      expect(formatQuantity(1234.5), '1.234,5');
      expect(formatQuantity(1000), '1.000');
      expect(formatQuantity(null), '—');
      expect(formatQuantity(0.25, decimals: 1), '0,3');
    });

    test('rótulos de mês e datas', () {
      expect(monthLabel('2026-04'), 'abr/26');
      expect(formatDate(DateTime(2026, 4, 5)), '05/04/2026');
      expect(formatCompact(1500), '1,5 mil');
    });
  });

  group('analytics', () {
    test('agrega consumo mensal de todas as matérias-primas', () {
      final points = aggregateMonthlyConsumption([
        material(
          id: 1,
          consumption: const [
            MonthlyConsumption(month: '2026-04', consumption: 10),
            MonthlyConsumption(month: '2026-05', consumption: 20),
          ],
        ),
        material(
          id: 2,
          consumption: const [
            MonthlyConsumption(month: '2026-04', consumption: 5),
            MonthlyConsumption(month: '2026-06', consumption: 7),
          ],
        ),
      ]);

      expect(points.map((p) => p.label), ['abr/26', 'mai/26', 'jun/26']);
      expect(points.map((p) => p.value), [15, 20, 7]);
    });

    test('ordena consumo de uma matéria-prima por mês', () {
      final points = monthlyConsumptionForMaterial(
        material(
          consumption: const [
            MonthlyConsumption(month: '2026-06', consumption: 7),
            MonthlyConsumption(month: '2026-04', consumption: 5),
          ],
        ),
      );
      expect(points.first.label, 'abr/26');
      expect(points.last.value, 7);
    });

    test('itens críticos vêm do menor saldo relativo ao mínimo', () {
      final rows = mergeStock(
        [
          material(id: 1, name: 'A', min: 100),
          material(id: 2, name: 'B', min: 100),
          material(id: 3, name: 'C', min: 100),
        ],
        const [
          StockItem(materialId: 1, name: 'A', quantity: 50),
          StockItem(materialId: 2, name: 'B', quantity: 10),
          StockItem(materialId: 3, name: 'C', quantity: 500),
        ],
      );

      final critical = lowStockRows(rows);
      expect(critical.map((row) => row.material.name), ['B', 'A']);
      expect(critical.first.quantity, 10);
    });

    test('saldo ausente é tratado como zero', () {
      final rows = mergeStock([material(id: 1)], const []);
      expect(rows.single.quantity, 0);
      expect(rows.single.belowMinimum, isTrue);
    });

    test('movimentações são agrupadas por mês e tipo', () {
      final points = movementSeries([
        StockMovement(
          id: 1,
          lotId: 1,
          type: 'ENTRADA',
          quantity: 100,
          date: DateTime(2026, 4, 2),
          note: null,
        ),
        StockMovement(
          id: 2,
          lotId: 1,
          type: 'SAIDA',
          quantity: 40,
          date: DateTime(2026, 4, 8),
          note: null,
        ),
        StockMovement(
          id: 3,
          lotId: 1,
          type: 'ENTRADA',
          quantity: 10,
          date: DateTime(2026, 5, 1),
          note: null,
        ),
      ]);

      expect(points, hasLength(2));
      expect(points.first.label, 'abr/26');
      expect(points.first.entries, 100);
      expect(points.first.exits, 40);
      expect(points.last.entries, 10);
    });

    test('previsões são somadas por mês de início', () {
      final points = forecastSeries([
        ForecastItem(
          id: 1,
          materialId: 1,
          forecastDate: DateTime(2026, 11, 1),
          periodStart: DateTime(2026, 11, 1),
          periodEnd: DateTime(2026, 11, 30),
          forecastConsumption: 100,
          confidence: 90,
          model: 'MEDIA_MOVEL',
        ),
        ForecastItem(
          id: 2,
          materialId: 2,
          forecastDate: DateTime(2026, 11, 1),
          periodStart: DateTime(2026, 11, 1),
          periodEnd: DateTime(2026, 11, 30),
          forecastConsumption: 50,
          confidence: 90,
          model: 'MEDIA_MOVEL',
        ),
      ]);

      expect(points.single.label, 'nov/26');
      expect(points.single.value, 150);
    });

    test('status de compras e produção viram fatias', () {
      final purchaseSlices = purchaseStatusSlices(
        const PurchaseSummary(pending: 3, received: 2, cancelled: 1),
      );
      expect(purchaseSlices.map((s) => s.value), [3, 2, 1]);

      final productionSlices = productionStatusSlices(
        const ProductionSummary(
          pending: 1,
          inProduction: 2,
          finished: 3,
          cancelled: 0,
        ),
      );
      expect(productionSlices, hasLength(4));
      expect(productionSlices[2].label, 'Finalizadas');
    });

    test('prioridades de alertas são contabilizadas', () {
      AlertItem alert(String? priority) => AlertItem(
        id: 1,
        type: 'REPOSICAO',
        materialId: null,
        lotId: null,
        description: null,
        priority: priority,
        resolved: false,
        date: DateTime(2026, 1, 1),
      );

      final slices = alertPrioritySlices([
        alert('ALTA'),
        alert('ALTA'),
        alert('MEDIA'),
        alert('BAIXA'),
        alert(null),
      ]);
      expect(slices.map((s) => s.value), [2, 1, 1]);
    });
  });
}
