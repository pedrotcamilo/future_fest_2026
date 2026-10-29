import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../api/api_client.dart';
import '../api_config.dart';

/// Preferências locais: tema (claro/escuro/sistema) e endereço do servidor.
class PreferencesController extends ChangeNotifier {
  PreferencesController(this._preferences, this._client);

  static const _themeKey = 'axionphare.theme_mode';
  static const _baseUrlKey = 'axionphare.base_url';

  final SharedPreferences _preferences;
  final ApiClient _client;

  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;
  String get baseUrl => _client.baseUrl;

  Future<void> load() async {
    final storedUrl = _preferences.getString(_baseUrlKey);
    if (storedUrl != null && storedUrl.isNotEmpty) {
      _client.baseUrl = storedUrl;
    }
    _themeMode = _parseTheme(_preferences.getString(_themeKey));
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    await _preferences.setString(_themeKey, switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    });
  }

  /// Alterna rapidamente entre claro e escuro (usado no botão da AppBar).
  Future<void> toggleBrightness(Brightness current) {
    return setThemeMode(
      current == Brightness.dark ? ThemeMode.light : ThemeMode.dark,
    );
  }

  Future<void> setBaseUrl(String raw) async {
    final normalized = ApiConfig.normalizeBaseUrl(raw);
    _client.baseUrl = normalized;
    notifyListeners();
    await _preferences.setString(_baseUrlKey, normalized);
  }

  static ThemeMode _parseTheme(String? value) {
    return switch (value) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }
}
