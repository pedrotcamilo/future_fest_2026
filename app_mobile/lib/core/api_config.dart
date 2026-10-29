import 'package:flutter/foundation.dart';

/// Configuração de acesso ao servidor AxionPhare.
///
/// A API não usa prefixo `/api` e as rotas de coleção exigem barra final.
class ApiConfig {
  const ApiConfig._();

  static const String appName = 'AxionPhare Glance';
  static const String appVersion = '0.1.0';

  /// Endereço padrão conforme o alvo em execução.
  ///
  /// Em dispositivo físico o usuário precisa informar o IP da máquina que
  /// executa o backend (a URL pode ser alterada na tela de login/ajustes).
  static String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:8000';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.linux:
      case TargetPlatform.windows:
      case TargetPlatform.fuchsia:
        return 'http://localhost:8000';
    }
  }

  /// Normaliza a URL digitada pelo usuário.
  static String normalizeBaseUrl(String raw) {
    var value = raw.trim();
    if (value.isEmpty) return defaultBaseUrl;
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'http://$value';
    }
    while (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    return value;
  }
}

/// Caminhos da API (sem prefixo).
class Endpoints {
  const Endpoints._();

  static const String identity = '/diagnosticos/axionphare_desktop';
  static const String serverInfo = '/diagnosticos/informacao_servidor';
  static const String databaseStatus = '/diagnosticos/status_banco';

  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  static const String dashboard = '/dashboard/';
  static const String dashboardPurchases = '/dashboard/compras';
  static const String dashboardProduction = '/dashboard/producao';
  static const String dashboardForecasts = '/dashboard/previsoes';
  static const String dashboardAlerts = '/dashboard/alertas';

  static const String stock = '/estoque/';
  static const String stockMovements = '/estoque/movimentacoes';
  static const String materials = '/materias-primas/';
  static const String alerts = '/alertas/';
  static const String forecasts = '/previsoes/';
  static const String suggestions = '/sugestoes-compra/';
  static const String purchases = '/compras/';
  static const String productionOrders = '/ordens-producao/';

  static String resolveAlert(int id) => '/alertas/$id/resolver';
  static String approveSuggestion(int id) => '/sugestoes-compra/$id/aprovar';
  static String rejectSuggestion(int id) => '/sugestoes-compra/$id/rejeitar';
}
