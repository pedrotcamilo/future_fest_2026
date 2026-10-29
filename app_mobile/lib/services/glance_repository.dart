import '../api/axion_api.dart';
import '../models/alert_item.dart';
import '../models/dashboard.dart';
import '../models/forecast_item.dart';
import '../models/material_item.dart';
import '../models/purchase_suggestion.dart';
import '../models/server_identity.dart';
import '../models/stock_item.dart';
import '../models/stock_movement.dart';
import 'snapshots.dart';

class _FetchResult<T> {
  const _FetchResult.value(this.value) : error = null;
  const _FetchResult.error(this.error) : value = null;

  final T? value;
  final Object? error;

  bool get ok => error == null;
}

Future<_FetchResult<T>> _load<T>(Future<T> future) async {
  try {
    return _FetchResult<T>.value(await future);
  } catch (error) {
    return _FetchResult<T>.error(error);
  }
}

Object? _firstError(List<_FetchResult<dynamic>> results) {
  for (final result in results) {
    if (!result.ok) return result.error;
  }
  return null;
}

/// Repositório que combina endpoints e tolera falhas parciais.
///
/// A API não pagina: listas chegam completas e o recorte é feito no cliente.
class GlanceRepository {
  GlanceRepository(this.api);

  final AxionApi api;

  Future<DashboardSnapshot> dashboard() async {
    final summary = await api.dashboard();

    final purchasesF = _load(api.purchaseSummary());
    final productionF = _load(api.productionSummary());
    final forecastsF = _load(api.forecastSummary());
    final alertSummaryF = _load(api.alertSummary());
    final stockF = _load(api.stock());
    final materialsF = _load(api.materials());
    final alertsF = _load(api.alerts());

    await Future.wait<dynamic>([
      purchasesF,
      productionF,
      forecastsF,
      alertSummaryF,
      stockF,
      materialsF,
      alertsF,
    ]);

    final purchases = await purchasesF;
    final production = await productionF;
    final forecasts = await forecastsF;
    final alertSummary = await alertSummaryF;
    final stock = await stockF;
    final materials = await materialsF;
    final alerts = await alertsF;

    final results = <_FetchResult<dynamic>>[
      purchases,
      production,
      forecasts,
      alertSummary,
      stock,
      materials,
      alerts,
    ];
    final failures = results.where((result) => !result.ok).length;

    var rows = <StockRow>[];
    if (materials.ok && stock.ok) {
      rows = mergeStock(materials.value!, stock.value!);
    }

    return DashboardSnapshot(
      summary: summary,
      purchases: purchases.value ?? PurchaseSummary.empty,
      production: production.value ?? ProductionSummary.empty,
      forecasts: forecasts.value ?? ForecastSummary.empty,
      alertSummary: alertSummary.value ?? AlertSummary.empty,
      stockRows: rows,
      alerts: alerts.value ?? const <AlertItem>[],
      failedRequests: failures,
      firstError: _firstError(results),
    );
  }

  Future<ChartsSnapshot> charts() async {
    final materialsF = _load(api.materials());
    final stockF = _load(api.stock());
    final purchasesF = _load(api.purchaseSummary());
    final productionF = _load(api.productionSummary());
    final movementsF = _load(api.movements());
    final forecastsF = _load(api.forecasts());

    await Future.wait<dynamic>([
      materialsF,
      stockF,
      purchasesF,
      productionF,
      movementsF,
      forecastsF,
    ]);

    final materials = await materialsF;
    final stock = await stockF;
    final purchases = await purchasesF;
    final production = await productionF;
    final movements = await movementsF;
    final forecasts = await forecastsF;

    final results = <_FetchResult<dynamic>>[
      materials,
      stock,
      purchases,
      production,
      movements,
      forecasts,
    ];
    final failures = results.where((result) => !result.ok).length;
    if (failures == results.length) {
      throw _firstError(results)!;
    }

    final materialList = materials.value ?? const <MaterialItem>[];
    final stockList = stock.value ?? const <StockItem>[];

    return ChartsSnapshot(
      materials: materialList,
      stockRows: mergeStock(materialList, stockList),
      purchases: purchases.value ?? PurchaseSummary.empty,
      production: production.value ?? ProductionSummary.empty,
      movements: movements.value ?? const <StockMovement>[],
      forecasts: forecasts.value ?? const <ForecastItem>[],
      failedRequests: failures,
      firstError: _firstError(results),
    );
  }

  Future<StockSnapshot> stock() async {
    final materials = await api.materials();
    final stockF = await _load(api.stock());
    final rows = mergeStock(materials, stockF.value ?? const <StockItem>[]);

    return StockSnapshot(
      rows: rows,
      failedRequests: stockF.ok ? 0 : 1,
      firstError: stockF.error,
    );
  }

  Future<ReplenishmentSnapshot> replenishment() async {
    final materialsF = _load(api.materials());
    final forecastsF = _load(api.forecasts());
    final suggestionsF = _load(api.suggestions());

    await Future.wait<dynamic>([materialsF, forecastsF, suggestionsF]);

    final materials = await materialsF;
    final forecasts = await forecastsF;
    final suggestions = await suggestionsF;

    final results = <_FetchResult<dynamic>>[materials, forecasts, suggestions];
    final failures = results.where((result) => !result.ok).length;
    if (failures == results.length) {
      throw _firstError(results)!;
    }

    return ReplenishmentSnapshot(
      materials: materials.value ?? const <MaterialItem>[],
      forecasts: forecasts.value ?? const <ForecastItem>[],
      suggestions: suggestions.value ?? const <PurchaseSuggestion>[],
      failedRequests: failures,
      firstError: _firstError(results),
    );
  }

  Future<ServerSnapshot> serverOverview() async {
    final identityF = _load(api.identity());
    final statusF = _load(api.databaseStatus());
    final infoF = _load(api.serverInfo());

    await Future.wait<dynamic>([identityF, statusF, infoF]);

    final identity = await identityF;
    final status = await statusF;
    final info = await infoF;

    final results = <_FetchResult<dynamic>>[identity, status, info];
    final failures = results.where((result) => !result.ok).length;
    if (failures == results.length) {
      throw _firstError(results)!;
    }

    return ServerSnapshot(
      identity: identity.value ?? ServerIdentity.fallback,
      status: status.value,
      serverInfo: info.value,
      failedRequests: failures,
      firstError: _firstError(results),
    );
  }

  Future<List<AlertItem>> alerts() => api.alerts();

  Future<void> resolveAlert(int id) => api.resolveAlert(id);

  Future<void> approveSuggestion(int id) => api.approveSuggestion(id);

  Future<void> rejectSuggestion(int id) => api.rejectSuggestion(id);
}
