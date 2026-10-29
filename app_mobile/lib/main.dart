import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api/api_client.dart';
import 'api/axion_api.dart';
import 'app.dart';
import 'core/api_config.dart';
import 'core/state/app_services.dart';
import 'core/state/preferences_controller.dart';
import 'core/state/session_controller.dart';
import 'services/glance_repository.dart';
import 'services/token_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final sharedPreferences = await SharedPreferences.getInstance();
  final apiClient = ApiClient(baseUrl: ApiConfig.defaultBaseUrl);
  final preferences = PreferencesController(sharedPreferences, apiClient);
  await preferences.load();

  final api = AxionApi(apiClient);
  final session = SessionController(api, SecureTokenStore());

  final services = AppServices(
    apiClient: apiClient,
    api: api,
    preferences: preferences,
    session: session,
    repository: GlanceRepository(api),
  );

  // A validação do token ocorre em segundo plano; a splash cobre a espera.
  unawaited(session.restore());

  runApp(AxionGlanceApp(services: services));
}
