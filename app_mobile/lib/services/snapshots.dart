import '../models/alert_item.dart';
import '../models/dashboard.dart';
import '../models/database_status.dart';
import '../models/forecast_item.dart';
import '../models/material_item.dart';
import '../models/purchase_suggestion.dart';
import '../models/server_identity.dart';
import '../models/stock_item.dart';
import '../models/stock_movement.dart';

/// Fotografia dos dados exibidos na visão geral.
class DashboardSnapshot {
  const DashboardSnapshot({
    required this.summary,
    required this.purchases,
    required this.production,
    required this.forecasts,
    required this.alertSummary,
    required this.stockRows,
    required this.alerts,
    required this.failedRequests,
    required this.firstError,
  });

  final DashboardSummary summary;
  final PurchaseSummary purchases;
  final ProductionSummary production;
  final ForecastSummary forecasts;
  final AlertSummary alertSummary;
  final List<StockRow> stockRows;
  final List<AlertItem> alerts;
  final int failedRequests;
  final Object? firstError;

  bool get hasPartialFailure => failedRequests > 0;
}

/// Dados das telas analíticas (gráficos).
class ChartsSnapshot {
  const ChartsSnapshot({
    required this.materials,
    required this.stockRows,
    required this.purchases,
    required this.production,
    required this.movements,
    required this.forecasts,
    required this.failedRequests,
    required this.firstError,
  });

  final List<MaterialItem> materials;
  final List<StockRow> stockRows;
  final PurchaseSummary purchases;
  final ProductionSummary production;
  final List<StockMovement> movements;
  final List<ForecastItem> forecasts;
  final int failedRequests;
  final Object? firstError;

  bool get hasPartialFailure => failedRequests > 0;
}

/// Estoque consolidado por matéria-prima.
class StockSnapshot {
  const StockSnapshot({
    required this.rows,
    required this.failedRequests,
    required this.firstError,
  });

  final List<StockRow> rows;
  final int failedRequests;
  final Object? firstError;

  bool get hasPartialFailure => failedRequests > 0;
}

/// Previsões e sugestões de compra.
class ReplenishmentSnapshot {
  const ReplenishmentSnapshot({
    required this.materials,
    required this.forecasts,
    required this.suggestions,
    required this.failedRequests,
    required this.firstError,
  });

  final List<MaterialItem> materials;
  final List<ForecastItem> forecasts;
  final List<PurchaseSuggestion> suggestions;
  final int failedRequests;
  final Object? firstError;

  bool get hasPartialFailure => failedRequests > 0;

  MaterialItem? materialById(int? id) {
    if (id == null) return null;
    for (final material in materials) {
      if (material.id == id) return material;
    }
    return null;
  }
}

/// Identidade, status do banco e informações do host.
class ServerSnapshot {
  const ServerSnapshot({
    required this.identity,
    required this.status,
    required this.serverInfo,
    required this.failedRequests,
    required this.firstError,
  });

  final ServerIdentity identity;
  final DatabaseStatus? status;
  final String? serverInfo;
  final int failedRequests;
  final Object? firstError;

  bool get hasPartialFailure => failedRequests > 0;
}
