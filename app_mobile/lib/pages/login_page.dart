import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/api_config.dart';
import '../core/state/app_scope.dart';
import '../models/database_status.dart';
import '../models/server_identity.dart';
import '../widgets/async_content.dart';
import '../widgets/brand_mark.dart';

/// Tela de entrada. A API é pública para consulta, então também é possível
/// continuar como visitante (somente leitura).
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _serverController = TextEditingController();

  bool _initialized = false;
  bool _obscurePassword = true;
  bool _submitting = false;
  bool _testingServer = true;
  String? _loginError;
  String? _serverError;
  ServerIdentity? _identity;
  DatabaseStatus? _databaseStatus;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final services = AppScope.of(context);
    _serverController.text = services.preferences.baseUrl;
    _testServer();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  Future<void> _testServer() async {
    final api = AppScope.of(context).api;
    setState(() {
      _testingServer = true;
      _serverError = null;
    });

    final identityFuture = api.identity();
    final statusFuture = api.databaseStatus();
    try {
      final results = await Future.wait<dynamic>([
        identityFuture,
        statusFuture,
      ]);
      if (!mounted) return;
      setState(() {
        _identity = results[0] as ServerIdentity;
        _databaseStatus = results[1] as DatabaseStatus;
        _testingServer = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _testingServer = false;
        _identity = null;
        _databaseStatus = null;
        _serverError = error is ApiException
            ? error.message
            : 'Não foi possível identificar o servidor.';
      });
    }
  }

  Future<void> _applyServer() async {
    final services = AppScope.of(context);
    final normalized = ApiConfig.normalizeBaseUrl(_serverController.text);
    final uri = Uri.tryParse(normalized);
    final valid =
        uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;

    if (!valid) {
      setState(() {
        _serverError =
            'Informe um endereço válido, como http://192.168.0.10:8000';
      });
      return;
    }

    await services.preferences.setBaseUrl(normalized);
    if (!mounted) return;
    _serverController.text = services.preferences.baseUrl;
    await _testServer();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _loginError = 'Informe e-mail e senha.');
      return;
    }

    final session = AppScope.of(context).session;
    setState(() {
      _submitting = true;
      _loginError = null;
    });

    try {
      await session.login(email, password);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _loginError = error.isUnauthorized
            ? 'Credenciais inválidas.'
            : error.message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _loginError = 'Não foi possível entrar: $error');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Center(child: BrandMark(size: 128)),
                  const SizedBox(height: 16),
                  Text(
                    _identity?.name ?? ApiConfig.appName,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _identity?.company.isNotEmpty == true
                        ? _identity!.company
                        : 'Gestão de farmácia de manipulação',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Entrar', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 16),
                          TextField(
                            key: const ValueKey('login_email'),
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(
                              labelText: 'E-mail',
                              prefixIcon: Icon(Icons.mail_outline),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            key: const ValueKey('login_password'),
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            autofillHints: const [AutofillHints.password],
                            textInputAction: TextInputAction.done,
                            onSubmitted: (_) => _submitting ? null : _submit(),
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                tooltip: _obscurePassword
                                    ? 'Mostrar senha'
                                    : 'Ocultar senha',
                                onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                ),
                              ),
                            ),
                          ),
                          if (_loginError != null) ...[
                            const SizedBox(height: 12),
                            InlineNotice(
                              message: _loginError!,
                              severity: NoticeSeverity.error,
                            ),
                          ],
                          const SizedBox(height: 16),
                          FilledButton(
                            onPressed: _submitting ? null : _submit,
                            child: _submitting
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text('Entrar'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    clipBehavior: Clip.antiAlias,
                    child: ExpansionTile(
                      leading: const Icon(Icons.dns_outlined),
                      title: const Text('Servidor'),
                      subtitle: Text(
                        AppScope.of(context).preferences.baseUrl,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        TextField(
          controller: _serverController,
          keyboardType: TextInputType.url,
          autocorrect: false,
          decoration: const InputDecoration(
            labelText: 'Endereço do servidor',
            hintText: 'http://192.168.0.10:8000',
            prefixIcon: Icon(Icons.link),
          ),
        ),
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.tonalIcon(
            onPressed: _testingServer ? null : _applyServer,
            icon: const Icon(Icons.wifi_tethering),
            label: const Text('Salvar e testar'),
          ),
        ),
        const SizedBox(height: 10),
        _ServerStatus(
          testing: _testingServer,
          error: _serverError,
          status: _databaseStatus,
          onRetry: _testServer,
        ),
      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${ApiConfig.appName} ${ApiConfig.appVersion}',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ServerStatus extends StatelessWidget {
  const _ServerStatus({
    required this.testing,
    required this.error,
    required this.status,
    required this.onRetry,
  });

  final bool testing;
  final String? error;
  final DatabaseStatus? status;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    if (testing) {
      return const Row(
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 8),
          Text('Testando conexão…'),
        ],
      );
    }
    if (error != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InlineNotice(message: error!, severity: NoticeSeverity.error),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => onRetry(),
            icon: const Icon(Icons.refresh),
            label: const Text('Testar novamente'),
          ),
        ],
      );
    }
    if (status == null) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final fallback = status!.usingFallback;
    final color = fallback ? scheme.tertiary : scheme.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              fallback
                  ? Icons.warning_amber_outlined
                  : Icons.check_circle_outline,
              size: 18,
              color: color,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                fallback
                    ? 'Banco em modo alternativo (${status!.activeDatabase})'
                    : 'Conectado ao banco principal',
                style: theme.textTheme.bodySmall,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Failovers: ${status!.totalFailovers} • Recuperações: ${status!.totalRecoveries}',
          style: theme.textTheme.labelSmall?.copyWith(
            color: scheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}