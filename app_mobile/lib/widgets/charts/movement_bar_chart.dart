import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/analytics.dart';
import '../../core/formatters.dart';
import 'chart_common.dart';

/// Barras agrupadas de entradas e saídas de estoque por mês.
class MovementBarChart extends StatelessWidget {
  const MovementBarChart({super.key, required this.points, this.unit = ''});

  final List<MovementPoint> points;
  final String unit;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const ChartEmpty(message: 'Sem movimentações registradas.');
    }

    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final entryColor = scheme.primary;
    final exitColor = scheme.tertiary;
    final maxValue = points.fold<double>(
      0,
      (max, point) => math.max(max, math.max(point.entries, point.exits)),
    );
    final maxY = ChartCommon.chartMax(maxValue);
    final interval = ChartCommon.niceInterval(maxY / 4);
    final axisStyle = ChartCommon.axisLabel(theme);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ChartLegend(
          entries: [
            ChartLegendEntry(label: 'Entradas', color: entryColor),
            ChartLegendEntry(label: 'Saídas', color: exitColor),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              minY: 0,
              maxY: maxY,
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: interval,
                getDrawingHorizontalLine: (value) => FlLine(
                  color: scheme.outlineVariant.withValues(alpha: 0.6),
                  strokeWidth: 1,
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 42,
                    interval: interval,
                    getTitlesWidget: (value, meta) => SideTitleWidget(
                      meta: meta,
                      space: 4,
                      child: Text(formatCompact(value), style: axisStyle),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 26,
                    interval: 1,
                    getTitlesWidget: (value, meta) {
                      final index = value.round();
                      if (index < 0 || index >= points.length) {
                        return const SizedBox.shrink();
                      }
                      return SideTitleWidget(
                        meta: meta,
                        space: 6,
                        child: Text(points[index].label, style: axisStyle),
                      );
                    },
                  ),
                ),
              ),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipColor: (_) => scheme.inverseSurface,
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    final point = points[group.x];
                    return BarTooltipItem(
                      '${point.label}\n'
                      'Entradas: ${formatQuantity(point.entries)}$unit\n'
                      'Saídas: ${formatQuantity(point.exits)}$unit',
                      TextStyle(color: scheme.onInverseSurface, fontSize: 12),
                    );
                  },
                ),
              ),
              barGroups: [
                for (var i = 0; i < points.length; i++)
                  BarChartGroupData(
                    x: i,
                    barsSpace: 2,
                    barRods: [
                      BarChartRodData(
                        toY: points[i].entries,
                        width: 8,
                        color: entryColor,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(3),
                        ),
                      ),
                      BarChartRodData(
                        toY: points[i].exits,
                        width: 8,
                        color: exitColor,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(3),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
