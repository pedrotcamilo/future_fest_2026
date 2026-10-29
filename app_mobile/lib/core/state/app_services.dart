import '../../api/api_client.dart';
import '../../api/axion_api.dart';
import '../../services/glance_repository.dart';
import 'preferences_controller.dart';
import 'session_controller.dart';

/// Dependências compartilhadas pelo app.
class AppServices {
  AppServices({
    required this.apiClient,
    required this.api,
    required this.preferences,
    required this.session,
    required this.repository,
  });

  final ApiClient apiClient;
  final AxionApi api;
  final PreferencesController preferences;
  final SessionController session;
  final GlanceRepository repository;
}
