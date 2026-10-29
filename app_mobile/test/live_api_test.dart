import 'package:axionphare_glance/api/api_client.dart';
import 'package:axionphare_glance/api/axion_api.dart';
import 'package:axionphare_glance/core/analytics.dart';
import 'package:axionphare_glance/services/glance_repository.dart';
import 'package:flutter_test/flutter_test.dart';

/// Teste opcional contra uma instância real:
/// flutter test test/live_api_test.dart \
///   --dart-define=AXION_BASE_URL=http://localhost:8000
const _baseUrl = String.fromEnvironment('AXION_BASE_URL');

void main() {
  test(
    'consulta todos os dados usados pelo app',
    () async {
      final client = ApiClient(baseUrl: _baseUrl);
      final api = AxionApi(client);
      final repository = GlanceRepository(api);

      final identity = await api.identity();
      final status = await api.databaseStatus();
      final dashboard = await repository.dashboard();
      final charts = await repository.charts();
      final stock = await repository.stock();
      final alerts = await api.alerts();
      final replenishment = await repository.replenishment();

      expect(identity.name, isNotEmpty);
      expect(status.activeDatabase, isNotEmpty);
      expect(dashboard.failedRequests, 0);
      expect(dashboard.summary.totalMaterials, greaterThanOrEqualTo(0));
      expect(dashboard.stockRows, isNotEmpty);
      expect(charts.failedRequests, 0);
      expect(charts.materials, isNotEmpty);

      final consumption = aggregateMonthlyConsumption(charts.materials);
      expect(consumption, isNotEmpty);
      expect(movementSeries(charts.movements), isNotEmpty);

      expect(stock.rows, isNotEmpty);
      expect(alerts, isNotEmpty);
      expect(replenishment.forecasts, isNotEmpty);
      expect(replenishment.suggestions, isNotEmpty);

      // ignore: avoid_print
      print(
        'OK: ${identity.name} | ${dashboard.summary.totalMaterials} MP | '
        '${lowStockRows(stock.rows).length} críticos | '
        '${alerts.length} alertas | ${charts.forecasts.length} previsões | '
        '${replenishment.suggestions.length} sugestões',
      );
    },
    skip: _baseUrl.isEmpty
        ? 'Defina --dart-define=AXION_BASE_URL para testar um servidor real.'
        : false,
  );
}
