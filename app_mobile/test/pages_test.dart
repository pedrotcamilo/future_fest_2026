import 'dart:convert';

import 'package:axionphare_glance/api/api_client.dart';
import 'package:axionphare_glance/api/axion_api.dart';
import 'package:axionphare_glance/core/api_config.dart';
import 'package:axionphare_glance/core/state/app_scope.dart';
import 'package:axionphare_glance/core/state/app_services.dart';
import 'package:axionphare_glance/core/state/preferences_controller.dart';
import 'package:axionphare_glance/core/state/reload_controller.dart';
import 'package:axionphare_glance/core/state/session_controller.dart';
import 'package:axionphare_glance/core/theme/app_theme.dart';
import 'package:axionphare_glance/pages/alerts_page.dart';
import 'package:axionphare_glance/pages/charts_page.dart';
import 'package:axionphare_glance/pages/dashboard_page.dart';
import 'package:axionphare_glance/pages/more_page.dart';
import 'package:axionphare_glance/pages/replenishment_page.dart';
import 'package:axionphare_glance/pages/settings_page.dart';
import 'package:axionphare_glance/pages/stock_page.dart';
import 'package:axionphare_glance/services/glance_repository.dart';
import 'package:axionphare_glance/services/token_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

http.Response _json(Object data) => http.Response(
  jsonEncode(data),
  200,
  headers: {'content-type': 'application/json; charset=utf-8'},
);

Map<String, Object?> _material(
  int id,
  String name, {
  required double min,
  required double max,
  required List<double> consumption,
}) {
  const months = [
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
  ];
  return {
    'id': id,
    'codigo': 'MP-00$id',
    'nome': name,
    'unidade': 'g',
    'estoque_minimo': min,
    'estoque_maximo': max,
    'consumo_medio_mensal': 200.0,
    'ativo': true,
    'consumo_mensal': [
      for (var i = 0; i < months.length; i++)
        {'mes': months[i], 'consumo': consumption[i]},
    ],
  };
}

Future<AppServices> _services() async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();

  final client = ApiClient(
    baseUrl: 'http://localhost:8000',
    httpClient: MockClient((request) async {
      final path = request.url.path;
      if (path == Endpoints.identity) {
        return _json({'intendidade': 'Farmácia Teste', 'empresa': 'Axion'});
      }
      if (path == Endpoints.databaseStatus) {
        return _json({
          'banco_ativo': 'primary',
          'primario_disponivel': true,
          'total_failovers': 0,
          'total_recuperacoes': 0,
        });
      }
      if (path == Endpoints.serverInfo) {
        return http.Response(
          'Linux (teste)',
          200,
          headers: {'content-type': 'text/plain'},
        );
      }
      if (path == Endpoints.dashboard) {
        return _json({
          'total_materias_primas': 2,
          'compras_pendentes': 3,
          'ordens_em_producao': 2,
          'alertas_ativos': 2,
        });
      }
      if (path == Endpoints.dashboardPurchases) {
        return _json({'pendentes': 3, 'recebidas': 2, 'canceladas': 1});
      }
      if (path == Endpoints.dashboardProduction) {
        return _json({
          'pendentes': 1,
          'em_producao': 2,
          'finalizadas': 3,
          'canceladas': 0,
        });
      }
      if (path == Endpoints.dashboardForecasts) {
        return _json({'total_previsoes': 2, 'total_consumo_previsto': 4500.0});
      }
      if (path == Endpoints.dashboardAlerts) {
        return _json({'total': 4, 'nao_resolvidos': 2, 'alta_prioridade': 1});
      }
      if (path == Endpoints.stock) {
        return _json([
          {'materia_prima_id': 1, 'nome': 'Omeprazol', 'estoque': 3450.0},
          {
            'materia_prima_id': 2,
            'nome': 'Lactose monoidratada',
            'estoque': 72.0,
          },
        ]);
      }
      if (path == Endpoints.materials) {
        return _json([
          _material(
            1,
            'Omeprazol',
            min: 500,
            max: 4000,
            consumption: [2050, 2100, 2180, 2250, 2300, 2350],
          ),
          _material(
            2,
            'Lactose monoidratada',
            min: 500,
            max: 3000,
            consumption: [100, 120, 90, 180, 130, 160],
          ),
        ]);
      }
      if (path == Endpoints.alerts) {
        return _json([
          {
            'id': 18,
            'tipo': 'REPOSICAO',
            'materia_prima_id': null,
            'lote_id': null,
            'descricao': 'Compra pendente de aprovação',
            'prioridade': 'ALTA',
            'resolvido': false,
            'data_alerta': '2026-08-09 10:00:00',
          },
          {
            'id': 17,
            'tipo': 'VENCIMENTO',
            'materia_prima_id': 1,
            'lote_id': 4,
            'descricao': 'Lote vencido',
            'prioridade': 'BAIXA',
            'resolvido': true,
            'data_alerta': '2026-08-01 08:00:00',
          },
        ]);
      }
      if (path == Endpoints.forecasts) {
        return _json([
          {
            'id': 1,
            'materia_prima_id': 1,
            'data_previsao': '2026-11-01',
            'periodo_inicio': '2026-11-01',
            'periodo_fim': '2026-11-30',
            'consumo_previsto': 2400.0,
            'confianca': 90.0,
            'modelo_utilizado': 'MEDIA_MOVEL',
          },
          {
            'id': 2,
            'materia_prima_id': 2,
            'data_previsao': '2026-11-01',
            'periodo_inicio': '2026-11-01',
            'periodo_fim': '2026-11-30',
            'consumo_previsto': 140.0,
            'confianca': 90.0,
            'modelo_utilizado': 'MEDIA_MOVEL',
          },
        ]);
      }
      if (path == Endpoints.suggestions) {
        return _json([
          {
            'id': 1,
            'materia_prima_id': 2,
            'data_sugestao': '2026-10-01',
            'quantidade_sugerida': 2928.0,
            'motivo': 'Estoque abaixo do mínimo',
            'status': 'PENDENTE',
          },
          {
            'id': 2,
            'materia_prima_id': 1,
            'data_sugestao': '2026-09-01',
            'quantidade_sugerida': 550.0,
            'motivo': 'Reposição',
            'status': 'APROVADA',
          },
        ]);
      }
      if (path == Endpoints.stockMovements) {
        return _json([
          {
            'id': 1,
            'lote_id': 1,
            'tipo': 'ENTRADA',
            'quantidade': 2500.0,
            'data_movimento': '2026-08-01 08:00:00',
            'observacao': 'Recebimento',
          },
          {
            'id': 2,
            'lote_id': 1,
            'tipo': 'SAIDA',
            'quantidade': 300.0,
            'data_movimento': '2026-09-03 09:00:00',
            'observacao': 'Consumo',
          },
        ]);
      }
      return http.Response('Ok', 200, headers: {'content-type': 'text/plain'});
    }),
  );

  final preferences = PreferencesController(prefs, client);
  await preferences.load();
  final api = AxionApi(client);
  final session = SessionController(api, MemoryTokenStore());
  await session.continueAsGuest();

  return AppServices(
    apiClient: client,
    api: api,
    preferences: preferences,
    session: session,
    repository: GlanceRepository(api),
  );
}

Future<void> _pumpPage(
  WidgetTester tester,
  AppServices services,
  Widget page, {
  bool wrapInScaffold = true,
}) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  final content = wrapInScaffold ? Scaffold(body: page) : page;
  await tester.pumpWidget(
    AppScope(
      services: services,
      child: MaterialApp(theme: AppTheme.light(), home: content),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('visão geral renderiza em tela estreita', (tester) async {
    final services = await _services();
    final reload = ReloadController();
    addTearDown(reload.dispose);

    await _pumpPage(
      tester,
      services,
      DashboardPage(
        repository: services.repository,
        reload: reload,
        onOpenStock: () {},
        onOpenCharts: () {},
        onOpenAlerts: () {},
        onOpenReplenishment: () {},
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Resumo da operação'), findsOneWidget);
    expect(find.text('Estoque crítico'), findsOneWidget);
    expect(find.text('Lactose monoidratada'), findsOneWidget);
    expect(find.text('Compras pendentes'), findsOneWidget);
  });

  testWidgets('estoque filtra itens abaixo do mínimo', (tester) async {
    final services = await _services();
    final reload = ReloadController();
    addTearDown(reload.dispose);

    await _pumpPage(
      tester,
      services,
      StockPage(repository: services.repository, reload: reload),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Omeprazol'), findsOneWidget);
    expect(find.text('Lactose monoidratada'), findsOneWidget);

    await tester.tap(find.text('Abaixo do mínimo (1)'));
    await tester.pumpAndSettle();

    expect(find.text('Omeprazol'), findsNothing);
    expect(find.text('Lactose monoidratada'), findsOneWidget);
  });

  testWidgets('gráficos renderizam com dados da API', (tester) async {
    final services = await _services();
    final reload = ReloadController();
    addTearDown(reload.dispose);

    await _pumpPage(
      tester,
      services,
      ChartsPage(repository: services.repository, reload: reload),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Consumo mensal'), findsOneWidget);
    expect(find.text('Estoque atual'), findsOneWidget);

    // As seções abaixo ficam fora da viewport e são construídas sob demanda.
    for (final title in [
      'Movimentações de estoque',
      'Status operacional',
      'Consumo previsto',
    ]) {
      await tester.scrollUntilVisible(find.text(title), 250);
      expect(find.text(title), findsOneWidget);
    }
  });

  testWidgets('alertas exibem filtros e itens', (tester) async {
    final services = await _services();
    final reload = ReloadController();
    addTearDown(reload.dispose);

    await _pumpPage(
      tester,
      services,
      AlertsPage(repository: services.repository, reload: reload),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Em aberto (1)'), findsOneWidget);
    expect(find.text('Compra pendente de aprovação'), findsOneWidget);
    expect(find.text('Resolver'), findsOneWidget);
  });

  testWidgets('aba Mais mostra identidade e status do servidor', (
    tester,
  ) async {
    final services = await _services();
    final reload = ReloadController();
    addTearDown(reload.dispose);

    await _pumpPage(
      tester,
      services,
      MorePage(
        repository: services.repository,
        reload: reload,
        onOpenSettings: () {},
        onOpenReplenishment: () {},
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Farmácia Teste'), findsOneWidget);
    expect(find.text('primary'), findsOneWidget);
    expect(find.text('Visitante'), findsOneWidget);
  });

  testWidgets('reposição alterna entre previsões e sugestões', (tester) async {
    final services = await _services();

    await _pumpPage(tester, services, const ReplenishmentPage());

    expect(tester.takeException(), isNull);
    expect(find.textContaining('Omeprazol'), findsWidgets);

    await tester.tap(find.text('Sugestões (2)'));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Aprovar'), findsOneWidget);
    expect(find.text('Rejeitar'), findsOneWidget);
  });

  testWidgets('configurações mostram tema e conexão', (tester) async {
    final services = await _services();

    await _pumpPage(tester, services, const SettingsPage());

    expect(tester.takeException(), isNull);
    expect(find.text('Aparência'), findsOneWidget);
    expect(find.text('Claro'), findsOneWidget);
    expect(find.text('Escuro'), findsOneWidget);
    expect(find.text('Farmácia Teste'), findsOneWidget);
  });
}
