import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/analytics.dart';
import '../../core/formatters.dart';
import 'chart_common.dart';

/// Pizza com legenda, usada para status de compras, produção e alertas.
class StatusPieChart extends StatelessWidget {
  const StatusPieChart({
    super.key,
    required this.slices,
    this.emptyMessage = 'Sem dados para exibir.',
  });

  final List<StatusSlice> slices;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    final visible = [
      for (final slice in slices)
        if (slice.value > 0) slice,
    ];
    if (visible.isEmpty) return ChartEmpty(message: emptyMessage);

    final scheme = Theme.of(context).colorScheme;
    final colors = ChartCommon.palette(scheme);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 150,
          child: PieChart(
            PieChartData(
              centerSpaceRadius: 28,
              sectionsSpace: 2,
              sections: [
                for (var i = 0; i < visible.length; i++)
                  PieChartSectionData(
                    value: visible[i].value,
                    color: colors[i % colors.length],
                    radius: 46,
                    showTitle: false,
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        ChartLegend(
          entries: [
            for (var i = 0; i < visible.length; i++)
              ChartLegendEntry(
                label:
                    '${visible[i].label} (${formatQuantity(visible[i].value, decimals: 0)})',
                color: colors[i % colors.length],
              ),
          ],
        ),
      ],
    );
  }
}
