import 'package:flutter/material.dart';

import '../core/formatters.dart';
import '../core/state/reload_controller.dart';
import '../models/stock_item.dart';
import '../services/glance_repository.dart';
import '../services/snapshots.dart';
import '../widgets/async_content.dart';
import '../widgets/status_chip.dart';

/// Lista de matérias-primas com saldo consolidado e filtro local.
class StockPage extends StatefulWidget {
  const StockPage({super.key, required this.repository, required this.reload});

  final GlanceRepository repository;
  final ReloadController reload;

  @override
  State<StockPage> createState() => _StockPageState();
}

class _StockPageState extends ReloadAwareState<StockPage> {
  final _searchController = TextEditingController();
  late Future<StockSnapshot> _future;
  String _query = '';
  bool _onlyLow = false;

  @override
  ReloadController get reloadController => widget.reload;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<StockSnapshot> _load() => widget.repository.stock();

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

  List<StockRow> _filtered(StockSnapshot snapshot) {
    final query = _query.trim().toLowerCase();
    return snapshot.rows
        .where((row) {
          if (_onlyLow && !row.belowMinimum) return false;
          if (query.isEmpty) return true;
          final name = row.material.name.toLowerCase();
          final code = (row.material.code ?? '').toLowerCase();
          return name.contains(query) || code.contains(query);
        })
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshFutureBuilder<StockSnapshot>(
      future: _future,
      onRefresh: refresh,
      builder: (context, snapshot) {
        final filtered = _filtered(snapshot);
        final critical = snapshot.rows.where((row) => row.belowMinimum).length;

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _query = value),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                labelText: 'Buscar matéria-prima',
                hintText: 'Nome ou código',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Limpar busca',
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                      ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                FilterChip(
                  label: Text('Abaixo do mínimo ($critical)'),
                  selected: _onlyLow,
                  onSelected: (value) => setState(() => _onlyLow = value),
                  avatar: const Icon(Icons.warning_amber_outlined, size: 16),
                ),
                Text(
                  '${filtered.length} de ${snapshot.rows.length} itens',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            if (snapshot.hasPartialFailure) ...[
              const SizedBox(height: 12),
              const InlineNotice(
                message:
                    'O saldo consolidado não pôde ser carregado. '
                    'Os itens aparecem com saldo zero.',
              ),
            ],
            const SizedBox(height: 16),
            if (filtered.isEmpty)
              const EmptyState(
                message:
                    'Nenhuma matéria-prima encontrada com os filtros atuais.',
                icon: Icons.inventory_2_outlined,
              )
            else
              for (final row in filtered) ...[
                _StockCard(row: row),
                const SizedBox(height: 8),
              ],
          ],
        );
      },
    );
  }
}

class _StockCard extends StatelessWidget {
  const _StockCard({required this.row});

  final StockRow row;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final ratio = row.maximumRatio;
    final below = row.belowMinimum;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        row.material.name,
                        style: theme.textTheme.titleSmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (row.material.code != null)
                        Text(
                          row.material.code!,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                if (!row.material.active)
                  const StatusChip(label: 'Inativo')
                else if (below)
                  const StatusChip(
                    label: 'Abaixo do mínimo',
                    tone: StatusTone.danger,
                  )
                else
                  const StatusChip(label: 'Regular', tone: StatusTone.success),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Saldo: ${formatQuantity(row.quantity)}${row.material.displayUnit}',
              style: theme.textTheme.bodyMedium,
            ),
            if (ratio != null) ...[
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: ratio,
                minHeight: 6,
                borderRadius: BorderRadius.circular(3),
                color: below ? scheme.error : scheme.primary,
              ),
            ],
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  'mín. ${formatQuantity(row.minimum)}${row.material.displayUnit}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                Text(
                  'máx. ${formatQuantity(row.maximum)}${row.material.displayUnit}',
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
