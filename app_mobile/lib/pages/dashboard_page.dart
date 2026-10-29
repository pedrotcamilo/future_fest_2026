import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/analytics.dart';
import '../core/formatters.dart';
import '../core/state/reload_controller.dart';
import '../models/alert_item.dart';
import '../models/stock_item.dart';
import '../services/glance_repository.dart';
import '../services/snapshots.dart';
import '../widgets/async_content.dart';
import '../widgets/kpi_card.dart';
import '../widgets/section_card.dart';
import '../widgets/status_chip.dart';

/// Visão geral: KPIs, estoque crítico, alertas e resumo operacional.
class DashboardPage extends StatefulWidget {
  const DashboardPage({
    super.key,
    required this.repository,
    required this.reload,
    required this.onOpenStock,
    required this.onOpenCharts,
    required this.onOpenAlerts,
    required this.onOpenReplenishment,
  });

  final GlanceRepository repository;
  final ReloadController reload;
  final VoidCallback onOpenStock;
  final VoidCallback onOpenCharts;
  final VoidCallback onOpenAlerts;
  final VoidCallback onOpenReplenishment;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ReloadAwareState<DashboardPage> {
  late Future<DashboardSnapshot> _future;

  @override
  ReloadController get reloadController => widget.reload;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<DashboardSnapshot> _load() => widget.repository.dashboard();

  @override
  Future<void> refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // O FutureBuilder exibe o erro.
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshFutureBuilder<DashboardSnapshot>(
      future: _future,
      onRefresh: refresh,
      builder: (context, snapshot) {
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _DashboardHeader(onRefresh: refresh),
            const SizedBox(height: 16),
            if (snapshot.hasPartialFailure) ...[
              InlineNotice(
                message: _partialMessage(snapshot.firstError),
                severity: NoticeSeverity.warning,
              ),
              const SizedBox(height: 16),
            ],
            _KpiGrid(snapshot: snapshot, onOpenAlerts: widget.onOpenAlerts),
            const SizedBox(height: 16),
            _LowStockCard(
              rows: lowStockRows(snapshot.stockRows),
              onOpenStock: widget.onOpenStock,
            ),
            const SizedBox(height: 16),
            _RecentAlertsCard(
              alerts: snapshot.alerts,
              onOpenAlerts: widget.onOpenAlerts,
            ),
            const SizedBox(height: 16),
            _OperationalCard(snapshot: snapshot),
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                final chartsButton = FilledButton.tonalIcon(
                  onPressed: widget.onOpenCharts,
                  icon: const Icon(Icons.insights_outlined),
                  label: const Text('Ver gráficos'),
                );
                final replenishmentButton = OutlinedButton.icon(
                  onPressed: widget.onOpenReplenishment,
                  icon: const Icon(Icons.playlist_add_check),
                  label: const Text('Reposição'),
                );
                if (constraints.maxWidth < 380) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      chartsButton,
                      const SizedBox(height: 8),
                      replenishmentButton,
                    ],
                  );
                }
                return Row(
                  children: [
                    Expanded(child: chartsButton),
                    const SizedBox(width: 12),
                    Expanded(child: replenishmentButton),
                  ],
                );
              },
            ),
          ],
        );
      },
    );
  }

  String _partialMessage(Object? error) {
    final detail = error is ApiException ? ': ${error.message}' : '.';
    return 'Alguns dados não puderam ser carregados$detail';
  }
}

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader({required this.onRefresh});

  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Resumo da operação', style: theme.textTheme.titleMedium),
              Text(
                'Atualizado em ${formatDate(DateTime.now())}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Atualizar',
          onPressed: () => onRefresh(),
          icon: const Icon(Icons.refresh),
        ),
      ],
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.snapshot, required this.onOpenAlerts});

  final DashboardSnapshot snapshot;
  final VoidCallback onOpenAlerts;

  @override
  Widget build(BuildContext context) {
    final lowStock = lowStockRows(snapshot.stockRows);
    final summary = snapshot.summary;

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 680 ? 4 : 2;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 4,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            mainAxisExtent: 118,
          ),
          itemBuilder: (context, index) {
            return switch (index) {
              0 => KpiCard(
                label: 'Matérias-primas',
                value: summary.totalMaterials.toString(),
                icon: Icons.inventory_2_outlined,
                caption: '${lowStock.length} abaixo do mínimo',
              ),
              1 => KpiCard(
                label: 'Compras pendentes',
                value: summary.pendingPurchases.toString(),
                icon: Icons.shopping_cart_outlined,
                caption: '${snapshot.purchases.received} recebidas',
              ),
              2 => KpiCard(
                label: 'Ordens em produção',
                value: summary.ordersInProduction.toString(),
                icon: Icons.precision_manufacturing_outlined,
                caption: '${snapshot.production.finished} finalizadas',
              ),
              _ => KpiCard(
                label: 'Alertas ativos',
                value: summary.activeAlerts.toString(),
                icon: Icons.notifications_outlined,
                caption:
                    '${snapshot.alertSummary.highPriority} de alta prioridade',
                onTap: onOpenAlerts,
              ),
            };
          },
        );
      },
    );
  }
}

class _LowStockCard extends StatelessWidget {
  const _LowStockCard({required this.rows, required this.onOpenStock});

  final List<StockRow> rows;
  final VoidCallback onOpenStock;

  @override
  Widget build(BuildContext context) {
    final visible = rows.take(5).toList();
    return SectionCard(
      title: 'Estoque crítico',
      subtitle: rows.isEmpty
          ? 'Nenhum item abaixo do mínimo.'
          : '${rows.length} ${plural(rows.length, 'item abaixo', 'itens abaixo')} do estoque mínimo',
      trailing: TextButton(
        onPressed: onOpenStock,
        child: const Text('Ver estoque'),
      ),
      child: visible.isEmpty
          ? const EmptyState(
              message: 'Todos os saldos estão acima do mínimo configurado.',
              icon: Icons.check_circle_outline,
            )
          : Column(
              children: [
                for (var i = 0; i < visible.length; i++) ...[
                  if (i > 0) const Divider(height: 16),
                  _LowStockTile(row: visible[i]),
                ],
              ],
            ),
    );
  }
}

class _LowStockTile extends StatelessWidget {
  const _LowStockTile({required this.row});

  final StockRow row;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                row.material.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium,
              ),
              Text(
                'Saldo ${formatQuantity(row.quantity)}${row.material.displayUnit}'
                ' • mínimo ${formatQuantity(row.minimum)}${row.material.displayUnit}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        const StatusChip(label: 'Abaixo', tone: StatusTone.danger),
      ],
    );
  }
}

class _RecentAlertsCard extends StatelessWidget {
  const _RecentAlertsCard({required this.alerts, required this.onOpenAlerts});

  final List<AlertItem> alerts;
  final VoidCallback onOpenAlerts;

  @override
  Widget build(BuildContext context) {
    final unresolved = alerts.where((alert) => !alert.resolved).toList()
      ..sort((a, b) {
        final dateA = a.date;
        final dateB = b.date;
        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;
        return dateB.compareTo(dateA);
      });
    final visible = unresolved.take(3).toList();

    return SectionCard(
      title: 'Alertas em aberto',
      subtitle: unresolved.isEmpty
          ? 'Nenhum alerta pendente.'
          : '${unresolved.length} ${plural(unresolved.length, 'alerta', 'alertas')} para tratar',
      trailing: TextButton(
        onPressed: onOpenAlerts,
        child: const Text('Ver alertas'),
      ),
      child: visible.isEmpty
          ? const EmptyState(
              message: 'Nenhum alerta em aberto.',
              icon: Icons.notifications_none,
            )
          : Column(
              children: [
                for (var i = 0; i < visible.length; i++) ...[
                  if (i > 0) const Divider(height: 16),
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      visible[i].highPriority
                          ? Icons.error_outline
                          : Icons.warning_amber_outlined,
                      color: visible[i].highPriority
                          ? Theme.of(context).colorScheme.error
                          : Theme.of(context).colorScheme.tertiary,
                    ),
                    title: Text(
                      visible[i].description ?? 'Alerta #${visible[i].id}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      '${prettyStatus(visible[i].type)} • '
                      '${formatDateTime(visible[i].date)}',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    trailing: StatusChip(
                      label: prettyStatus(visible[i].priority),
                      tone: visible[i].highPriority
                          ? StatusTone.danger
                          : StatusTone.warning,
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}

class _OperationalCard extends StatelessWidget {
  const _OperationalCard({required this.snapshot});

  final DashboardSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Resumo operacional',
      child: Column(
        children: [
          _SummaryRow(
            icon: Icons.shopping_cart_outlined,
            title: 'Compras',
            value: '${snapshot.purchases.total}',
            details:
                '${snapshot.purchases.pending} pendentes • '
                '${snapshot.purchases.received} recebidas • '
                '${snapshot.purchases.cancelled} canceladas',
          ),
          const Divider(height: 20),
          _SummaryRow(
            icon: Icons.precision_manufacturing_outlined,
            title: 'Produção',
            value: '${snapshot.production.total}',
            details:
                '${snapshot.production.inProduction} em produção • '
                '${snapshot.production.finished} finalizadas • '
                '${snapshot.production.cancelled} canceladas',
          ),
          const Divider(height: 20),
          _SummaryRow(
            icon: Icons.auto_graph_outlined,
            title: 'Previsões',
            value: '${snapshot.forecasts.totalForecasts}',
            details:
                'Consumo previsto total: '
                '${formatQuantity(snapshot.forecasts.totalForecastConsumption)}',
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.icon,
    required this.title,
    required this.value,
    required this.details,
  });

  final IconData icon;
  final String title;
  final String value;
  final String details;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.bodyMedium),
              Text(
                details,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        Text(value, style: theme.textTheme.titleMedium),
      ],
    );
  }
}
