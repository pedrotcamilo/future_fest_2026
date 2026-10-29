import 'package:flutter/material.dart';

enum StatusTone { neutral, success, warning, danger, info }

/// Etiqueta compacta para status e prioridades.
class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    this.tone = StatusTone.neutral,
    this.icon,
  });

  final String label;
  final StatusTone tone;
  final IconData? icon;

  factory StatusChip.forStatus(String? status) {
    final normalized = (status ?? '').toUpperCase();
    final tone = switch (normalized) {
      'RECEBIDA' ||
      'FINALIZADA' ||
      'CONCLUIDA' ||
      'CONCLUÍDO' => StatusTone.success,
      'EM_PRODUCAO' || 'EM_ANDAMENTO' || 'AGUARDANDO' => StatusTone.info,
      'CANCELADA' || 'CANCELADO' => StatusTone.danger,
      'PENDENTE' || 'NOVO' || 'AGENDADA' => StatusTone.warning,
      _ => StatusTone.neutral,
    };
    return StatusChip(label: prettyStatus(status), tone: tone);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = switch (tone) {
      StatusTone.neutral => scheme.onSurfaceVariant,
      StatusTone.success => scheme.primary,
      StatusTone.warning => scheme.tertiary,
      StatusTone.danger => scheme.error,
      StatusTone.info => scheme.secondary,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall
                ?.copyWith(color: color, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

String prettyStatus(String? status) {
  final value = (status ?? '').trim();
  if (value.isEmpty) return '—';
  final lower = value.toLowerCase().replaceAll('_', ' ');
  return lower[0].toUpperCase() + lower.substring(1);
}
