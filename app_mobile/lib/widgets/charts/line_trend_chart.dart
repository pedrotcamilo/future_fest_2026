import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/analytics.dart';
import '../../core/formatters.dart';
import 'chart_common.dart';

/// Gráfico de linha simples para séries mensais (consumo, previsão).
class LineTrendChart extends StatelessWidget {
  const LineTrendChart({
    super.key,
    required this.points,
    this.unit = '',
    this.color,
    this.showArea = true,
    this.emptyMessage = 'Sem dados para exibir.',
  });

  final List<ChartPoint> points;
  final String unit;
  final Color? color;
  final bool showArea;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) return ChartEmpty(message: emptyMessage);

    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lineColor = color ?? scheme.primary;
    final maxValue = points.fold<double>(
      0,
      (max, p) => p.value > max ? p.value : max,
    );
    final maxY = ChartCommon.chartMax(maxValue);
    final interval = ChartCommon.niceInterval(maxY / 4);
    final axisStyle = ChartCommon.axisLabel(theme);

    return LineChart(
      LineChartData(
        minX: 0,
        maxX: points.length <= 1 ? 1 : (points.length - 1).toDouble(),
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
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => scheme.inverseSurface,
            getTooltipItems: (spots) => [
              for (final spot in spots)
                LineTooltipItem(
                  '${points[spot.x.round()].label}\n'
                  '${formatQuantity(spot.y)}$unit',
                  TextStyle(color: scheme.onInverseSurface, fontSize: 12),
                ),
            ],
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: [
              for (var i = 0; i < points.length; i++)
                FlSpot(i.toDouble(), points[i].value),
            ],
            isCurved: false,
            color: lineColor,
            barWidth: 2.5,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) =>
                  FlDotCirclePainter(
                    radius: 3,
                    color: lineColor,
                    strokeWidth: 1,
                    strokeColor: scheme.surface,
                  ),
            ),
            belowBarData: BarAreaData(
              show: showArea,
              color: lineColor.withValues(alpha: 0.12),
            ),
          ),
        ],
      ),
    );
  }
}
