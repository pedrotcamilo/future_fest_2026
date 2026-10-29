import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/api_config.dart';
import '../core/state/app_scope.dart';
import '../core/state/reload_controller.dart';
import '../services/glance_repository.dart';
import '../services/snapshots.dart';
import '../widgets/async_content.dart';
import '../widgets/brand_mark.dart';
import '../widgets/section_card.dart';
import '../widgets/status_chip.dart';

/// Central de informações do servidor, sessão e atalhos secundários.
class MorePage extends StatefulWidget {
  const MorePage({
    super.key,
    required this.repository,
    required this.reload,
    required this.onOpenSettings,
    required this.onOpenReplenishment,
  });

  final GlanceRepository repository;
  final ReloadController reload;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenReplenishment;

  @override
  State<MorePage> createState() => _MorePageState();
}

class _MorePageState extends ReloadAwareState<MorePage> {
  late Future<ServerSnapshot> _future;

  @override
  ReloadController get reloadController => widget.reload;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<ServerSnapshot> _load() => widget.repository.serverOverview();

  @override
  Future<void> refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // Erro exibido pelo FutureBuilder.
    }
  }

  @override
  Widget build(BuildContext context) {
    final services = AppScope.of(context);
    final session = services.session;
    final user = session.user;

    return RefreshFutureBuilder<ServerSnapshot>(
      future: _future,
      onRefresh: refresh,
      builder: (context, snapshot) {
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            BrandHeader(
              title: snapshot.identity.name,
              subtitle: snapshot.identity.company,
              size: 96,
            ),
            const SizedBox(height: 16),
            if (snapshot.hasPartialFailure) ...[
              InlineNotice(
                message: _partialMessage(snapshot.firstError),
                severity: NoticeSeverity.warning,
              ),
              const SizedBox(height: 16),
            ],
            SectionCard(
              title: 'Sessão',
              child: Row(
                children: [
                  CircleAvatar(
                    child: Icon(
                      user == null ? Icons.person_outline : Icons.person,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                user?.name ?? 'Visitante',
                                style: Theme.of(context).textTheme.titleSmall,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (user?.admin == true) ...[
                              const SizedBox(width: 8),
                              const StatusChip(
                                label: 'Admin',
                                tone: StatusTone.info,
                              ),
                            ],
                          ],
                        ),
                        Text(
                          user?.email ??
                              'Consultando sem autenticação (somente leitura).',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () => session.logout(),
                    child: Text(user == null ? 'Entrar' : 'Sair'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.playlist_add_check),
                    title: const Text('Reposição'),
                    subtitle: const Text(
                      'Previsões de consumo e sugestões de compra',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: widget.onOpenReplenishment,
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.settings_outlined),
                    title: const Text('Configurações'),
                    subtitle: const Text('Tema, servidor e sessão'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: widget.onOpenSettings,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Servidor',
              subtitle: services.preferences.baseUrl,
              trailing: IconButton(
                tooltip: 'Testar conexão',
                onPressed: () => refresh(),
                icon: const Icon(Icons.refresh),
              ),
              child: Column(
                children: [
                  _InfoRow(
                    label: 'Banco ativo',
                    value: snapshot.status?.activeDatabase ?? 'indisponível',
                  ),
                  const Divider(height: 20),
                  _InfoRow(
                    label: 'Primário disponível',
                    value: snapshot.status == null
                        ? '—'
                        : snapshot.status!.primaryAvailable
                        ? 'Sim'
                        : 'Não',
                  ),
                  const Divider(height: 20),
                  _InfoRow(
                    label: 'Failovers',
                    value: '${snapshot.status?.totalFailovers ?? 0}',
                  ),
                  const Divider(height: 20),
                  _InfoRow(
                    label: 'Recuperações',
                    value: '${snapshot.status?.totalRecoveries ?? 0}',
                  ),
                  if (snapshot.serverInfo != null &&
                      snapshot.serverInfo!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      childrenPadding: const EdgeInsets.only(bottom: 8),
                      title: const Text('Informação do servidor'),
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: SelectableText(
                            snapshot.serverInfo!,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(fontFamily: 'monospace'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Sobre',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InfoRow(
                    label: 'Aplicativo',
                    value: '${ApiConfig.appName} ${ApiConfig.appVersion}',
                  ),
                  const SizedBox(height: 6),
                  _InfoRow(label: 'API', value: services.preferences.baseUrl),
                  const SizedBox(height: 6),
                  Text(
                    'Tokens de sessão ficam na memória do servidor; '
                    'reiniciar o backend exige novo login.',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  String _partialMessage(Object? error) {
    final detail = error is ApiException ? ': ${error.message}' : '.';
    return 'Algumas informações do servidor não estão disponíveis$detail';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
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
    );
  }
}
