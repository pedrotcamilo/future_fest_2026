import 'dart:convert';

import 'package:axionphare_glance/api/api_client.dart';
import 'package:axionphare_glance/api/axion_api.dart';
import 'package:axionphare_glance/core/api_config.dart';
import 'package:axionphare_glance/core/state/app_scope.dart';
import 'package:axionphare_glance/core/state/app_services.dart';
import 'package:axionphare_glance/core/state/preferences_controller.dart';
import 'package:axionphare_glance/core/state/session_controller.dart';
import 'package:axionphare_glance/core/theme/app_theme.dart';
import 'package:axionphare_glance/pages/login_page.dart';
import 'package:axionphare_glance/services/glance_repository.dart';
import 'package:axionphare_glance/services/token_store.dart';
import 'package:axionphare_glance/widgets/theme_toggle_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<AppServices> buildServices() async {
  SharedPreferences.setMockInitialValues({});
  final sharedPreferences = await SharedPreferences.getInstance();

  final httpClient = MockClient((request) async {
    if (request.url.path == Endpoints.identity) {
      return http.Response(
        jsonEncode({'intendidade': 'Farmácia Teste', 'empresa': 'Axion'}),
        200,
        headers: {'content-type': 'application/json'},
      );
    }
    if (request.url.path == Endpoints.databaseStatus) {
      return http.Response(
        jsonEncode({
          'banco_ativo': 'primary',
          'primario_disponivel': true,
          'total_failovers': 0,
          'total_recuperacoes': 0,
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }
    return http.Response('Ok', 200, headers: {'content-type': 'text/plain'});
  });

  final client = ApiClient(
    baseUrl: 'http://localhost:8000',
    httpClient: httpClient,
  );
  final preferences = PreferencesController(sharedPreferences, client);
  await preferences.load();

  final api = AxionApi(client);
  final session = SessionController(api, MemoryTokenStore());

  return AppServices(
    apiClient: client,
    api: api,
    preferences: preferences,
    session: session,
    repository: GlanceRepository(api),
  );
}

void main() {
  testWidgets('login exibe a identidade do servidor', (tester) async {
    final services = await buildServices();

    await tester.pumpWidget(
      AppScope(
        services: services,
        child: MaterialApp(theme: AppTheme.light(), home: const LoginPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Farmácia Teste'), findsOneWidget);
    expect(find.text('Axion'), findsOneWidget);
    expect(find.text('Entrar'), findsWidgets);
  });

  testWidgets('visitante entra sem token', (tester) async {
    final services = await buildServices();

    await tester.pumpWidget(
      AppScope(
        services: services,
        child: MaterialApp(theme: AppTheme.light(), home: const LoginPage()),
      ),
    );
    await tester.pumpAndSettle();

    // Botão "Continuar sem login" foi removido;
    // a tela exibe apenas campos de credenciais.
    expect(find.text('Farmácia Teste'), findsOneWidget);
    expect(find.text('Axion'), findsOneWidget);
    expect(find.text('Entrar'), findsWidgets);
    expect(find.text('Continuar sem login'), findsNothing);
  });

  testWidgets('alterna entre tema claro e escuro', (tester) async {
    final services = await buildServices();

    await tester.pumpWidget(
      AppScope(
        services: services,
        child: ListenableBuilder(
          listenable: services.preferences,
          builder: (context, _) {
            return MaterialApp(
              theme: AppTheme.light(),
              darkTheme: AppTheme.dark(),
              themeMode: services.preferences.themeMode,
              home: Scaffold(
                appBar: AppBar(
                  title: const Text('Tema'),
                  actions: const [ThemeToggleButton()],
                ),
                body: const SizedBox.expand(),
              ),
            );
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    final before = Theme.of(tester.element(find.byType(Scaffold))).brightness;

    await tester.tap(find.byType(ThemeToggleButton));
    await tester.pumpAndSettle();

    final after = Theme.of(tester.element(find.byType(Scaffold))).brightness;

    expect(after, isNot(before));
    expect(services.preferences.themeMode, isNot(ThemeMode.system));
  });
}
