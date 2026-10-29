import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/api_config.dart';
import '../core/state/app_scope.dart';
import '../models/database_status.dart';
import '../models/server_identity.dart';
import '../widgets/async_content.dart';
import '../widgets/section_card.dart';
import '../widgets/status_chip.dart';
import '../widgets/theme_toggle_button.dart';

/// Ajustes de aparência, servidor e sessão.
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _serverController = TextEditingController();

  bool _initialized = false;
  bool _testing = false;
  bool _saving = false;
  String? _error;
  ServerIdentity? _identity;
  DatabaseStatus? _status;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    _serverController.text = AppScope.of(context).preferences.baseUrl;
    _testConnection();
  }

  @override
  void dispose() {
    _serverController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final api = AppScope.of(context).api;
    setState(() {
      _testing = true;
      _error = null;
    });

    try {
      final results = await Future.wait<dynamic>([
        api.identity(),
        api.databaseStatus(),
      ]);
      if (!mounted) return;
      setState(() {
        _identity = results[0] as ServerIdentity;
        _status = results[1] as DatabaseStatus;
        _testing = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _testing = false;
        _identity = null;
        _status = null;
        _error = error is ApiException ? error.message : error.toString();
      });
    }
  }

  Future<void> _saveServer() async {
    final services = AppScope.of(context);
    final normalized = ApiConfig.normalizeBaseUrl(_serverController.text);
    final uri = Uri.tryParse(normalized);
    final valid =
        uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;

    if (!valid) {
      setState(() {
        _error = 'Informe um endereço válido, como http://192.168.0.10:8000';
        _identity = null;
        _status = null;
      });
      return;
    }

    setState(() => _saving = true);
    await services.preferences.setBaseUrl(normalized);
    if (!mounted) return;
    _serverController.text = services.preferences.baseUrl;
    setState(() => _saving = false);
    await _testConnection();
  }

  Future<void> _logout() async {
    final session = AppScope.of(context).session;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Encerrar sessão?'),
        content: const Text(
          'O token será descartado. O servidor também invalida a sessão.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sair'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
    await session.logout();
  }

  Future<void> _leaveGuest() async {
    final session = AppScope.of(context).session;
    Navigator.of(context).popUntil((route) => route.isFirst);
    await session.logout();
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context);
    final session = services.session;
    final preferences = services.preferences;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Configurações'),
        actions: const [ThemeToggleButton()],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          SectionCard(
            title: 'Aparência',
            subtitle: 'Tema Material 3 claro, escuro ou seguindo o sistema.',
            child: ListenableBuilder(
              listenable: preferences,
              builder: (context, _) {
                return SizedBox(
                  width: double.infinity,
                  child: SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(
                        value: ThemeMode.light,
                        label: Text('Claro'),
                      ),
                      ButtonSegment(
                        value: ThemeMode.dark,
                        label: Text('Escuro'),
                      ),
                      ButtonSegment(
                        value: ThemeMode.system,
                        label: Text('Sistema'),
                      ),
                    ],
                    selected: {preferences.themeMode},
                    onSelectionChanged: (selection) =>
                        preferences.setThemeMode(selection.first),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          SectionCard(
            title: 'Servidor',
            subtitle: 'Endereço base da API, sem prefixo /api.',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _serverController,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'URL da API',
                    hintText: 'http://192.168.0.10:8000',
                    prefixIcon: Icon(Icons.link),
                  ),
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton.icon(
                    onPressed: (_testing || _saving) ? null : _saveServer,
                    icon: (_testing || _saving)
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.wifi_tethering),
                    label: const Text('Salvar e testar'),
                  ),
                ),
                const SizedBox(height: 12),
                if (_testing)
                  Row(
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Testando conexão…',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  )
                else if (_error != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      InlineNotice(
                        message: _error!,
                        severity: NoticeSeverity.error,
                      ),
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: _testConnection,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Testar novamente'),
                        ),
                      ),
                    ],
                  )
                else ...[
                  if (_identity != null)
                    _SettingRow(label: 'Identidade', value: _identity!.name),
                  if (_identity != null && _identity!.company.isNotEmpty)
                    _SettingRow(label: 'Empresa', value: _identity!.company),
                  if (_status != null)
                    _SettingRow(
                      label: 'Banco ativo',
                      value: _status!.usingFallback
                          ? '${_status!.activeDatabase} (alternativo)'
                          : _status!.activeDatabase,
                    ),
                  if (_status != null)
                    _SettingRow(
                      label: 'Primário disponível',
                      value: _status!.primaryAvailable ? 'Sim' : 'Não',
                    ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          SectionCard(
            title: 'Sessão',
            child: ListenableBuilder(
              listenable: session,
              builder: (context, _) {
                final user = session.user;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Icon(
                          user == null
                              ? Icons.visibility_outlined
                              : Icons.person_outline,
                          size: 20,
                          color: scheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user?.name ?? 'Visitante',
                                style: theme.textTheme.bodyMedium,
                              ),
                              Text(
                                user?.email ?? 'Sem autenticação no servidor.',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (user?.admin == true)
                          const StatusChip(
                            label: 'Admin',
                            tone: StatusTone.info,
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (user == null)
                      OutlinedButton.icon(
                        onPressed: _leaveGuest,
                        icon: const Icon(Icons.login),
                        label: const Text('Entrar com uma conta'),
                      )
                    else
                      OutlinedButton.icon(
                        onPressed: _logout,
                        icon: const Icon(Icons.logout),
                        label: const Text('Sair da conta'),
                      ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          SectionCard(
            title: 'Sobre',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SettingRow(
                  label: 'Aplicativo',
                  value: '${ApiConfig.appName} ${ApiConfig.appVersion}',
                ),
                _SettingRow(label: 'URL atual', value: preferences.baseUrl),
                const SizedBox(height: 6),
                Text(
                  'A API AxionPhare não versiona nem pagina os dados. '
                  'O token de sessão fica em memória no servidor e é '
                  'invalidado quando ele reinicia.',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  const _SettingRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: theme.textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}
