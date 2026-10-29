import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../core/analytics.dart';
import '../core/state/reload_controller.dart';
import '../models/material_item.dart';
import '../services/glance_repository.dart';
import '../services/snapshots.dart';
import '../widgets/async_content.dart';
import '../widgets/charts/line_trend_chart.dart';
import '../widgets/charts/movement_bar_chart.dart';
import '../widgets/charts/status_pie_chart.dart';
import '../widgets/charts/stock_bar_chart.dart';
import '../widgets/section_card.dart';

/// Gráficos gerados a partir dos dados da API.
class ChartsPage extends StatefulWidget {
  const ChartsPage({super.key, required this.repository, required this.reload});

  final GlanceRepository repository;
  final ReloadController reload;

  @override
  State<ChartsPage> createState() => _ChartsPageState();
}

class _ChartsPageState extends ReloadAwareState<ChartsPage> {
  late Future<ChartsSnapshot> _future;
  int _selectedMaterial = 0;

  @override
  ReloadController get reloadController => widget.reload;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<ChartsSnapshot> _load() => widget.repository.charts();

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

  MaterialItem? _materialById(List<MaterialItem> materials, int id) {
    for (final material in materials) {
      if (material.id == id) return material;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshFutureBuilder<ChartsSnapshot>(
      future: _future,
      onRefresh: refresh,
      builder: (context, snapshot) {
        final materials = [
          ...snapshot.materials,
        ]..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        final selectedMaterial = _materialById(materials, _selectedMaterial);
        final selectedId = selectedMaterial == null ? 0 : _selectedMaterial;
        final consumptionPoints = selectedMaterial == null
            ? aggregateMonthlyConsumption(materials)
            : monthlyConsumptionForMaterial(selectedMaterial);
        final unit = selectedMaterial?.displayUnit ?? '';

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Dados consolidados do servidor',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                IconButton(
                  tooltip: 'Atualizar',
                  onPressed: () => refresh(),
                  icon: const Icon(Icons.refresh),
                ),
              ],
            ),
            if (snapshot.hasPartialFailure) ...[
              const SizedBox(height: 8),
              InlineNotice(
                message: _partialMessage(snapshot.firstError),
                severity: NoticeSeverity.warning,
              ),
            ],
            const SizedBox(height: 16),
            SectionCard(
              title: 'Consumo mensal',
              subtitle: selectedMaterial == null
                  ? 'Soma do consumo de todas as matérias-primas (unidades variam).'
                  : 'Consumo dos últimos meses de ${selectedMaterial.name}.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<int>(
                    key: ValueKey(selectedId),
                    initialValue: selectedId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Matéria-prima',
                      prefixIcon: Icon(Icons.filter_alt_outlined),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: 0,
                        child: Text('Todas as matérias-primas'),
                      ),
                      for (final material in materials)
                        DropdownMenuItem(
                          value: material.id,
                          child: Text(
                            material.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                    onChanged: (value) =>
                        setState(() => _selectedMaterial = value ?? 0),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 220,
                    child: LineTrendChart(
                      points: consumptionPoints,
                      unit: unit,
                      emptyMessage:
                          'A API não retornou consumo mensal para o período.',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Estoque atual',
              subtitle:
                  'Maiores saldos consolidados (unidades variam por item).',
              child: SizedBox(
                height: 230,
                child: StockBarChart(
                  points: stockLevels(snapshot.stockRows, limit: 6),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Movimentações de estoque',
              subtitle: 'Entradas e saídas agrupadas por mês.',
              child: SizedBox(
                height: 250,
                child: MovementBarChart(
                  points: movementSeries(snapshot.movements),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Status operacional',
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final purchases = _StatusBlock(
                    title: 'Compras',
                    child: StatusPieChart(
                      slices: purchaseStatusSlices(snapshot.purchases),
                      emptyMessage: 'Sem compras registradas.',
                    ),
                  );
                  final production = _StatusBlock(
                    title: 'Produção',
                    child: StatusPieChart(
                      slices: productionStatusSlices(snapshot.production),
                      emptyMessage: 'Sem ordens registradas.',
                    ),
                  );
                  if (constraints.maxWidth >= 560) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: purchases),
                        const SizedBox(width: 24),
                        Expanded(child: production),
                      ],
                    );
                  }
                  return Column(
                    children: [
                      purchases,
                      const SizedBox(height: 24),
                      production,
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Consumo previsto',
              subtitle: 'Total previsto por mês (média móvel calculada pelo backend).',
              child: SizedBox(
                height: 210,
                child: LineTrendChart(
                  points: forecastSeries(snapshot.forecasts),
                  showArea: false,
                  color: Theme.of(context).colorScheme.tertiary,
                  emptyMessage: 'Nenhuma previsão cadastrada.',
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  String _partialMessage(Object? error) {
    final detail = error is ApiException ? ': ${error.message}' : '.';
    return 'Alguns gráficos usam dados parciais$detail';
  }
}

class _StatusBlock extends StatelessWidget {
  const _StatusBlock({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          title,
          style: theme.textTheme.labelLarge?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
