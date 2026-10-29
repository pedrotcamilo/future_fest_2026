import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/analytics.dart';
import '../../core/formatters.dart';
import 'chart_common.dart';

/// Barras verticais com o saldo das matérias-primas.
class StockBarChart extends StatelessWidget {
  const StockBarChart({
    super.key,
    required this.points,
    this.unit = '',
    this.color,
  });

  final List<ChartPoint> points;
  final String unit;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const ChartEmpty(message: 'Nenhum saldo de estoque encontrado.');
    }

    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final barColor = color ?? scheme.primary;
    final maxValue = points.fold<double>(
      0,
      (max, p) => p.value > max ? p.value : max,
    );
    final maxY = ChartCommon.chartMax(maxValue);
    final interval = ChartCommon.niceInterval(maxY / 4);
    final axisStyle = ChartCommon.axisLabel(theme);

    return BarChart(
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
              reservedSize: 34,
              interval: 1,
              getTitlesWidget: (value, meta) {
                final index = value.round();
                if (index < 0 || index >= points.length) {
                  return const SizedBox.shrink();
                }
                return SideTitleWidget(
                  meta: meta,
                  space: 6,
                  child: SizedBox(
                    width: 48,
                    child: Text(
                      points[index].label,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: axisStyle,
                    ),
                  ),
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
                '${point.label}\n${formatQuantity(rod.toY)}$unit',
                TextStyle(color: scheme.onInverseSurface, fontSize: 12),
              );
            },
          ),
        ),
        barGroups: [
          for (var i = 0; i < points.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: points[i].value,
                  width: 16,
                  color: barColor,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(4),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
