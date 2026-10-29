import 'package:flutter/foundation.dart';

import '../../api/axion_api.dart';
import '../../models/app_user.dart';
import '../../services/token_store.dart';

/// Sessão do usuário. O backend guarda tokens em memória, então a sessão pode
/// ser invalidada a qualquer momento por um restart do servidor.
class SessionController extends ChangeNotifier {
  SessionController(this._api, this._tokenStore);

  final AxionApi _api;
  final TokenStore _tokenStore;

  bool _booting = true;
  bool _guest = false;
  String? _token;
  AppUser? _user;

  bool get booting => _booting;
  bool get isGuest => _guest;
  bool get isAuthenticated => _token != null;
  bool get isActive => _token != null || _guest;
  String? get token => _token;
  AppUser? get user => _user;

  /// Tenta reutilizar o token salvo; se o servidor o rejeitar, limpa a sessão.
  Future<void> restore() async {
    _booting = true;
    notifyListeners();
    try {
      final stored = await _tokenStore.read();
      if (stored != null && stored.isNotEmpty) {
        _api.client.token = stored;
        try {
          _user = await _api.me();
          _token = stored;
        } catch (_) {
          _api.client.token = null;
          await _tokenStore.clear();
        }
      }
    } finally {
      _booting = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final token = await _api.login(email, password);
    try {
      _user = await _api.me();
    } catch (_) {
      _api.client.token = null;
      await _tokenStore.clear();
      rethrow;
    }
    _token = token;
    _guest = false;
    await _tokenStore.write(token);
    notifyListeners();
  }

  /// A API é pública para consulta; o app permite navegar sem login.
  Future<void> continueAsGuest() async {
    _token = null;
    _user = null;
    _guest = true;
    _api.client.token = null;
    await _tokenStore.clear();
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {
      // Servidor indisponível: encerra localmente de qualquer forma.
    }
    _api.client.token = null;
    _token = null;
    _user = null;
    _guest = false;
    await _tokenStore.clear();
    notifyListeners();
  }
}
