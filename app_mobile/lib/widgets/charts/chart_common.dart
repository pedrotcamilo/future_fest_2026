import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Utilitários visuais compartilhados pelos gráficos.
class ChartCommon {
  const ChartCommon._();

  static List<Color> palette(ColorScheme scheme) => [
    scheme.primary,
    scheme.tertiary,
    scheme.secondary,
    scheme.error,
    scheme.primary.withValues(alpha: 0.55),
    scheme.tertiary.withValues(alpha: 0.55),
  ];

  static TextStyle axisLabel(ThemeData theme) =>
      theme.textTheme.labelSmall?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        fontSize: 10,
      ) ??
      const TextStyle(fontSize: 10);

  /// Intervalo "redondo" (1, 2, 5 × 10ⁿ) para eixos.
  static double niceInterval(double raw) {
    if (raw <= 0) return 1;
    final exponent = (math.log(raw) / math.ln10).floor();
    final magnitude = math.pow(10, exponent).toDouble();
    final fraction = raw / magnitude;
    final nice = fraction <= 1
        ? 1.0
        : fraction <= 2
        ? 2.0
        : fraction <= 5
        ? 5.0
        : 10.0;
    return nice * magnitude;
  }

  static double chartMax(double maxValue) =>
      maxValue <= 0 ? 1 : maxValue * 1.18;
}

class ChartLegendEntry {
  const ChartLegendEntry({required this.label, required this.color});

  final String label;
  final Color color;
}

class ChartLegend extends StatelessWidget {
  const ChartLegend({super.key, required this.entries});

  final List<ChartLegendEntry> entries;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      spacing: 14,
      runSpacing: 6,
      children: [
        for (final entry in entries)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: entry.color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                entry.label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class ChartEmpty extends StatelessWidget {
  const ChartEmpty({super.key, this.message = 'Sem dados para exibir.'});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      height: 120,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.bar_chart_outlined,
              size: 28,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
