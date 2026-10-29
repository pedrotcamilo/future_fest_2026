import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/formatters.dart';
import '../core/state/reload_controller.dart';
import '../models/alert_item.dart';
import '../services/glance_repository.dart';
import '../widgets/async_content.dart';
import '../widgets/status_chip.dart';

enum _AlertFilter { open, all, high }

/// Alertas operacionais com filtros e ação de resolver.
class AlertsPage extends StatefulWidget {
  const AlertsPage({super.key, required this.repository, required this.reload});

  final GlanceRepository repository;
  final ReloadController reload;

  @override
  State<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends ReloadAwareState<AlertsPage> {
  late Future<List<AlertItem>> _future;
  _AlertFilter _filter = _AlertFilter.open;
  int? _resolvingId;

  @override
  ReloadController get reloadController => widget.reload;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<AlertItem>> _load() => widget.repository.alerts();

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

  List<AlertItem> _applyFilter(List<AlertItem> alerts) {
    final filtered =
        alerts.where((alert) {
          return switch (_filter) {
            _AlertFilter.open => !alert.resolved,
            _AlertFilter.all => true,
            _AlertFilter.high => alert.highPriority && !alert.resolved,
          };
        }).toList()..sort((a, b) {
          final dateA = a.date;
          final dateB = b.date;
          if (dateA == null && dateB == null) return 0;
          if (dateA == null) return 1;
          if (dateB == null) return -1;
          return dateB.compareTo(dateA);
        });
    return filtered;
  }

  Future<void> _resolve(AlertItem alert) async {
    setState(() => _resolvingId = alert.id);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await widget.repository.resolveAlert(alert.id);
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('Alerta #${alert.id} resolvido.')),
      );
      await refresh();
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            'Não foi possível resolver o alerta: '
            '${error is ApiException ? error.message : error}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _resolvingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshFutureBuilder<List<AlertItem>>(
      future: _future,
      onRefresh: refresh,
      builder: (context, alerts) {
        final open = alerts.where((alert) => !alert.resolved).toList();
        final high = open.where((alert) => alert.highPriority).length;
        final filtered = _applyFilter(alerts);

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${open.length} ${plural(open.length, 'alerta em aberto', 'alertas em aberto')}',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                if (high > 0)
                  StatusChip(
                    label: '$high alta prioridade',
                    tone: StatusTone.danger,
                    icon: Icons.error_outline,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(
                  label: Text('Em aberto (${open.length})'),
                  selected: _filter == _AlertFilter.open,
                  onSelected: (_) =>
                      setState(() => _filter = _AlertFilter.open),
                ),
                ChoiceChip(
                  label: Text('Alta prioridade ($high)'),
                  selected: _filter == _AlertFilter.high,
                  onSelected: (_) =>
                      setState(() => _filter = _AlertFilter.high),
                ),
                ChoiceChip(
                  label: Text('Todos (${alerts.length})'),
                  selected: _filter == _AlertFilter.all,
                  onSelected: (_) => setState(() => _filter = _AlertFilter.all),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (filtered.isEmpty)
              EmptyState(
                message: _filter == _AlertFilter.open
                    ? 'Nenhum alerta em aberto. Tudo em ordem.'
                    : 'Nenhum alerta encontrado para o filtro.',
                icon: Icons.notifications_none,
              )
            else
              for (final alert in filtered) ...[
                _AlertCard(
                  alert: alert,
                  resolving: _resolvingId == alert.id,
                  onResolve: () => _resolve(alert),
                ),
                const SizedBox(height: 8),
              ],
          ],
        );
      },
    );
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard({
    required this.alert,
    required this.resolving,
    required this.onResolve,
  });

  final AlertItem alert;
  final bool resolving;
  final VoidCallback onResolve;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final priorityTone = switch ((alert.priority ?? '').toUpperCase()) {
      'ALTA' => StatusTone.danger,
      'MEDIA' || 'MÉDIA' => StatusTone.warning,
      'BAIXA' => StatusTone.info,
      _ => StatusTone.neutral,
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusChip(
                  label: prettyStatus(alert.priority),
                  tone: priorityTone,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    prettyStatus(alert.type),
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (alert.resolved)
                  const StatusChip(
                    label: 'Resolvido',
                    tone: StatusTone.success,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              alert.description ?? 'Alerta #${alert.id}',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: scheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  formatDateTime(alert.date),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                if (alert.materialId != null) ...[
                  const SizedBox(width: 12),
                  Text(
                    'MP #${alert.materialId}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
                if (alert.lotId != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    'Lote #${alert.lotId}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
            if (!alert.resolved) ...[
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: resolving ? null : onResolve,
                  icon: resolving
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.task_alt, size: 18),
                  label: const Text('Resolver'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
