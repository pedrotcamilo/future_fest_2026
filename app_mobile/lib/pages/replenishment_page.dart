import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/analytics.dart';
import '../core/formatters.dart';
import '../core/state/app_scope.dart';
import '../models/forecast_item.dart';
import '../models/material_item.dart';
import '../models/purchase_suggestion.dart';
import '../services/snapshots.dart';
import '../widgets/async_content.dart';
import '../widgets/section_card.dart';
import '../widgets/status_chip.dart';
import '../widgets/theme_toggle_button.dart';

/// Previsões de consumo e sugestões de compra (com aprovação/rejeição).
class ReplenishmentPage extends StatefulWidget {
  const ReplenishmentPage({super.key});

  @override
  State<ReplenishmentPage> createState() => _ReplenishmentPageState();
}

class _ReplenishmentPageState extends State<ReplenishmentPage> {
  Future<ReplenishmentSnapshot>? _future;
  int? _busySuggestionId;
  bool? _busyApproving;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<ReplenishmentSnapshot> _load() =>
      AppScope.of(context).repository.replenishment();

  Future<void> refresh() async {
    final future = _load();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // Erro exibido pelo FutureBuilder.
    }
  }

  Future<void> _runSuggestion(
    PurchaseSuggestion suggestion, {
    required bool approve,
  }) async {
    final repository = AppScope.of(context).repository;
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _busySuggestionId = suggestion.id;
      _busyApproving = approve;
    });

    try {
      if (approve) {
        await repository.approveSuggestion(suggestion.id);
      } else {
        await repository.rejectSuggestion(suggestion.id);
      }
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            'Sugestão #${suggestion.id} '
            '${approve ? 'aprovada' : 'rejeitada'}.',
          ),
        ),
      );
      await refresh();
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            'Não foi possível atualizar a sugestão: '
            '${error is ApiException ? error.message : error}',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _busySuggestionId = null;
          _busyApproving = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final future = _future;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reposição'),
        actions: [
          IconButton(
            tooltip: 'Atualizar',
            onPressed: refresh,
            icon: const Icon(Icons.refresh),
          ),
          const ThemeToggleButton(),
        ],
      ),
      body: future == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshFutureBuilder<ReplenishmentSnapshot>(
              future: future,
              onRefresh: refresh,
              builder: (context, snapshot) {
                return DefaultTabController(
                  length: 2,
                  child: Column(
                    children: [
                      if (snapshot.hasPartialFailure)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                          child: InlineNotice(
                            message: _partialMessage(snapshot.firstError),
                          ),
                        ),
                      TabBar(
                        tabs: [
                          Tab(text: 'Previsões (${snapshot.forecasts.length})'),
                          Tab(
                            text: 'Sugestões (${snapshot.suggestions.length})',
                          ),
                        ],
                      ),
                      Expanded(
                        child: TabBarView(
                          children: [
                            _ForecastsTab(snapshot: snapshot),
                            _SuggestionsTab(
                              snapshot: snapshot,
                              busyId: _busySuggestionId,
                              busyApproving: _busyApproving,
                              onApprove: (suggestion) =>
                                  _runSuggestion(suggestion, approve: true),
                              onReject: (suggestion) =>
                                  _runSuggestion(suggestion, approve: false),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  String _partialMessage(Object? error) {
    final detail = error is ApiException ? ': ${error.message}' : '.';
    return 'Alguns dados de reposição não estão disponíveis$detail';
  }
}

class _ForecastsTab extends StatelessWidget {
  const _ForecastsTab({required this.snapshot});

  final ReplenishmentSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final forecasts = [...snapshot.forecasts]
      ..sort((a, b) {
        final dateA = a.periodStart ?? a.forecastDate;
        final dateB = b.periodStart ?? b.forecastDate;
        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;
        return dateA.compareTo(dateB);
      });

    if (forecasts.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: const [
          EmptyState(
            message:
                'Nenhuma previsão cadastrada.\n'
                'A geração automática é feita pelo backend.',
            icon: Icons.auto_graph_outlined,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: forecasts.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        return _ForecastCard(
          forecast: forecasts[index],
          material: snapshot.materialById(forecasts[index].materialId),
        );
      },
    );
  }
}

class _ForecastCard extends StatelessWidget {
  const _ForecastCard({required this.forecast, required this.material});

  final ForecastItem forecast;
  final MaterialItem? material;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final unit = material?.displayUnit ?? '';
    final periodStart = forecast.periodStart;
    final periodEnd = forecast.periodEnd;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    material?.name ?? 'Matéria-prima #${forecast.materialId}',
                    style: theme.textTheme.titleSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (periodStart != null)
                  StatusChip(
                    label: monthLabel(monthKey(periodStart)),
                    tone: StatusTone.info,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Consumo previsto: ${formatQuantity(forecast.forecastConsumption)}$unit',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Período: ${formatDate(periodStart)} a ${formatDate(periodEnd)}',
              style: theme.textTheme.labelSmall?.copyWith(
                color: scheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  'Confiança: ${percent(forecast.confidence)}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                Text(
                  prettyStatus(forecast.model),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SuggestionsTab extends StatelessWidget {
  const _SuggestionsTab({
    required this.snapshot,
    required this.busyId,
    required this.busyApproving,
    required this.onApprove,
    required this.onReject,
  });

  final ReplenishmentSnapshot snapshot;
  final int? busyId;
  final bool? busyApproving;
  final ValueChanged<PurchaseSuggestion> onApprove;
  final ValueChanged<PurchaseSuggestion> onReject;

  @override
  Widget build(BuildContext context) {
    final suggestions = [...snapshot.suggestions]
      ..sort((a, b) {
        if (a.isPending != b.isPending) return a.isPending ? -1 : 1;
        final dateA = a.date;
        final dateB = b.date;
        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;
        return dateB.compareTo(dateA);
      });

    if (suggestions.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: const [
          EmptyState(
            message: 'Nenhuma sugestão de compra cadastrada.',
            icon: Icons.shopping_basket_outlined,
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        const SectionCard(
          title: 'Como funciona',
          child: Text(
            'A sugestão é gerada pelo backend quando o saldo fica abaixo do '
            'estoque mínimo. Aprovar ou rejeitar altera apenas o status.',
          ),
        ),
        const SizedBox(height: 8),
        for (final suggestion in suggestions) ...[
          _SuggestionCard(
            suggestion: suggestion,
            material: snapshot.materialById(suggestion.materialId),
            busy: busyId == suggestion.id,
            approving: busyId == suggestion.id ? busyApproving : null,
            onApprove: () => onApprove(suggestion),
            onReject: () => onReject(suggestion),
          ),
          const SizedBox(height: 8),
        ],
      ],
    );
  }
}

class _SuggestionCard extends StatelessWidget {
  const _SuggestionCard({
    required this.suggestion,
    required this.material,
    required this.busy,
    required this.approving,
    required this.onApprove,
    required this.onReject,
  });

  final PurchaseSuggestion suggestion;
  final MaterialItem? material;
  final bool busy;
  final bool? approving;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final unit = material?.displayUnit ?? '';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    material?.name ?? 'Matéria-prima #${suggestion.materialId}',
                    style: theme.textTheme.titleSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                StatusChip.forStatus(suggestion.status),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Quantidade sugerida: '
              '${formatQuantity(suggestion.suggestedQuantity)}$unit',
              style: theme.textTheme.bodyMedium,
            ),
            if (suggestion.reason != null) ...[
              const SizedBox(height: 4),
              Text(
                suggestion.reason!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 6),
            Text(
              formatDateTime(suggestion.date),
              style: theme.textTheme.labelSmall?.copyWith(
                color: scheme.onSurfaceVariant,
              ),
            ),
            if (suggestion.isPending) ...[
              const SizedBox(height: 4),
              Wrap(
                alignment: WrapAlignment.end,
                spacing: 4,
                children: [
                  TextButton.icon(
                    onPressed: busy ? null : onReject,
                    icon: busy && approving == false
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.close, size: 18),
                    label: const Text('Rejeitar'),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: busy ? null : onApprove,
                    icon: busy && approving == true
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.check, size: 18),
                    label: const Text('Aprovar'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
