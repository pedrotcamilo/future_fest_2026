import '../core/api_config.dart';
import '../core/json_utils.dart';
import '../models/alert_item.dart';
import '../models/app_user.dart';
import '../models/dashboard.dart';
import '../models/database_status.dart';
import '../models/forecast_item.dart';
import '../models/material_item.dart';
import '../models/production_order.dart';
import '../models/purchase.dart';
import '../models/purchase_suggestion.dart';
import '../models/server_identity.dart';
import '../models/stock_item.dart';
import '../models/stock_movement.dart';
import 'api_client.dart';
import 'api_exception.dart';

/// Operações da API AxionPhare usadas pelo app.
class AxionApi {
  AxionApi(this.client);

  final ApiClient client;

  Future<dynamic> _get(
    String path, {
    Map<String, String>? query,
    Duration? timeout,
  }) => client.request('GET', path, query: query, requestTimeout: timeout);

  Future<dynamic> _post(
    String path, {
    Object? body,
    Map<String, String>? query,
    Duration? timeout,
  }) => client.request(
    'POST',
    path,
    body: body,
    query: query,
    requestTimeout: timeout,
  );

  // --- Diagnósticos -------------------------------------------------------

  Future<ServerIdentity> identity() async {
    return ServerIdentity.fromJson(asMap(await _get(Endpoints.identity)));
  }

  Future<DatabaseStatus> databaseStatus() async {
    return DatabaseStatus.fromJson(asMap(await _get(Endpoints.databaseStatus)));
  }

  Future<String> serverInfo() async {
    final data = await _get(Endpoints.serverInfo);
    return (data ?? '').toString().trim();
  }

  // --- Autenticação -------------------------------------------------------

  Future<String> login(String email, String senha) async {
    final data = asMap(
      await _post(
        Endpoints.login,
        body: {'email': email.trim(), 'senha': senha},
      ),
    );
    final token = asString(data['token']);
    if (asString(data['status']) != 'Autenticado' || token == null) {
      throw ApiException(401, data);
    }
    client.token = token;
    return token;
  }

  Future<AppUser> me() async {
    return AppUser.fromJson(asMap(await _get(Endpoints.me)));
  }

  Future<void> logout() async {
    try {
      await _post(Endpoints.logout);
    } finally {
      client.token = null;
    }
  }

  // --- Dashboard ----------------------------------------------------------

  Future<DashboardSummary> dashboard() async {
    return DashboardSummary.fromJson(asMap(await _get(Endpoints.dashboard)));
  }

  Future<PurchaseSummary> purchaseSummary() async {
    return PurchaseSummary.fromJson(
      asMap(await _get(Endpoints.dashboardPurchases)),
    );
  }

  Future<ProductionSummary> productionSummary() async {
    return ProductionSummary.fromJson(
      asMap(await _get(Endpoints.dashboardProduction)),
    );
  }

  Future<ForecastSummary> forecastSummary() async {
    return ForecastSummary.fromJson(
      asMap(await _get(Endpoints.dashboardForecasts)),
    );
  }

  Future<AlertSummary> alertSummary() async {
    return AlertSummary.fromJson(asMap(await _get(Endpoints.dashboardAlerts)));
  }

  // --- Estoque e cadastros ------------------------------------------------

  Future<List<StockItem>> stock() async {
    return StockItem.listFrom(await _get(Endpoints.stock));
  }

  Future<List<MaterialItem>> materials() async {
    return MaterialItem.listFrom(await _get(Endpoints.materials));
  }

  // --- Operação -----------------------------------------------------------

  Future<List<AlertItem>> alerts({bool? resolved}) async {
    return AlertItem.listFrom(
      await _get(
        Endpoints.alerts,
        query: resolved == null ? null : {'resolvido': resolved.toString()},
      ),
    );
  }

  Future<List<ForecastItem>> forecasts() async {
    return ForecastItem.listFrom(await _get(Endpoints.forecasts));
  }

  Future<List<PurchaseSuggestion>> suggestions() async {
    return PurchaseSuggestion.listFrom(await _get(Endpoints.suggestions));
  }

  Future<List<Purchase>> purchases() async {
    return Purchase.listFrom(await _get(Endpoints.purchases));
  }

  Future<List<ProductionOrder>> productionOrders() async {
    return ProductionOrder.listFrom(await _get(Endpoints.productionOrders));
  }

  Future<List<StockMovement>> movements() async {
    return StockMovement.listFrom(await _get(Endpoints.stockMovements));
  }

  // --- Ações --------------------------------------------------------------

  Future<void> resolveAlert(int id) async {
    await _post(Endpoints.resolveAlert(id));
  }

  Future<void> approveSuggestion(int id) async {
    await _post(Endpoints.approveSuggestion(id));
  }

  Future<void> rejectSuggestion(int id) async {
    await _post(Endpoints.rejectSuggestion(id));
  }
}
