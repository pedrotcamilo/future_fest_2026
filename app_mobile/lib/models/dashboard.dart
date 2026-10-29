import '../core/json_utils.dart';

/// KPIs gerais (`GET /dashboard/`).
class DashboardSummary {
  const DashboardSummary({
    required this.totalMaterials,
    required this.pendingPurchases,
    required this.ordersInProduction,
    required this.activeAlerts,
  });

  final int totalMaterials;
  final int pendingPurchases;
  final int ordersInProduction;
  final int activeAlerts;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalMaterials: asInt(json['total_materias_primas']) ?? 0,
      pendingPurchases: asInt(json['compras_pendentes']) ?? 0,
      ordersInProduction: asInt(json['ordens_em_producao']) ?? 0,
      activeAlerts: asInt(json['alertas_ativos']) ?? 0,
    );
  }
}

/// `GET /dashboard/compras`.
class PurchaseSummary {
  const PurchaseSummary({
    required this.pending,
    required this.received,
    required this.cancelled,
  });

  final int pending;
  final int received;
  final int cancelled;

  int get total => pending + received + cancelled;

  factory PurchaseSummary.fromJson(Map<String, dynamic> json) {
    return PurchaseSummary(
      pending: asInt(json['pendentes']) ?? 0,
      received: asInt(json['recebidas']) ?? 0,
      cancelled: asInt(json['canceladas']) ?? 0,
    );
  }

  static const empty = PurchaseSummary(pending: 0, received: 0, cancelled: 0);
}

/// `GET /dashboard/producao`.
class ProductionSummary {
  const ProductionSummary({
    required this.pending,
    required this.inProduction,
    required this.finished,
    required this.cancelled,
  });

  final int pending;
  final int inProduction;
  final int finished;
  final int cancelled;

  int get total => pending + inProduction + finished + cancelled;

  factory ProductionSummary.fromJson(Map<String, dynamic> json) {
    return ProductionSummary(
      pending: asInt(json['pendentes']) ?? 0,
      inProduction: asInt(json['em_producao']) ?? 0,
      finished: asInt(json['finalizadas']) ?? 0,
      cancelled: asInt(json['canceladas']) ?? 0,
    );
  }

  static const empty = ProductionSummary(
    pending: 0,
    inProduction: 0,
    finished: 0,
    cancelled: 0,
  );
}

/// `GET /dashboard/previsoes`.
class ForecastSummary {
  const ForecastSummary({
    required this.totalForecasts,
    required this.totalForecastConsumption,
  });

  final int totalForecasts;
  final double totalForecastConsumption;

  factory ForecastSummary.fromJson(Map<String, dynamic> json) {
    return ForecastSummary(
      totalForecasts: asInt(json['total_previsoes']) ?? 0,
      totalForecastConsumption: asDouble(json['total_consumo_previsto']) ?? 0,
    );
  }

  static const empty = ForecastSummary(
    totalForecasts: 0,
    totalForecastConsumption: 0,
  );
}

/// `GET /dashboard/alertas`.
class AlertSummary {
  const AlertSummary({
    required this.total,
    required this.unresolved,
    required this.highPriority,
  });

  final int total;
  final int unresolved;
  final int highPriority;

  factory AlertSummary.fromJson(Map<String, dynamic> json) {
    return AlertSummary(
      total: asInt(json['total']) ?? 0,
      unresolved: asInt(json['nao_resolvidos']) ?? 0,
      highPriority: asInt(json['alta_prioridade']) ?? 0,
    );
  }

  static const empty = AlertSummary(total: 0, unresolved: 0, highPriority: 0);
}
