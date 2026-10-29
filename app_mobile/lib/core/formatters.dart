/// Formatação de números e datas em pt-BR, sem dependências externas.
library;

const List<String> _monthsShort = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/// Quantidade com até [decimals] casas (padrão 2), sem zeros à direita.
String formatQuantity(num? value, {int decimals = 2}) {
  if (value == null) return '—';
  final fixed = value.toDouble().toStringAsFixed(decimals);
  var text = fixed;
  if (text.contains('.')) {
    text = text.replaceFirst(RegExp(r'0+$'), '');
    text = text.replaceFirst(RegExp(r'\.$'), '');
  }
  final parts = text.split('.');
  final integer = parts.first.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+$)'),
    (match) => '${match[1]}.',
  );
  return parts.length > 1 ? '$integer,${parts[1]}' : integer;
}

/// Versão curta para eixos de gráfico (1.2 mil, 3,4 mi).
String formatCompact(num? value) {
  if (value == null) return '—';
  final abs = value.abs();
  if (abs >= 1000000) {
    return '${formatQuantity(value / 1000000, decimals: 1)} mi';
  }
  if (abs >= 1000) {
    return '${formatQuantity(value / 1000, decimals: 1)} mil';
  }
  return formatQuantity(value, decimals: abs >= 10 ? 0 : 1);
}

String formatDate(DateTime? value) {
  if (value == null) return '—';
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  return '$day/$month/${value.year}';
}

String formatDateTime(DateTime? value) {
  if (value == null) return '—';
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '${formatDate(value)} $hour:$minute';
}

String monthShort(DateTime value) => _monthsShort[value.month - 1];

/// Rótulo curto de um mês `YYYY-MM` → `abr/26`.
String monthLabel(String yearMonth) {
  final parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  final month = int.tryParse(parts[1]);
  if (month == null || month < 1 || month > 12) return yearMonth;
  final year = parts[0].length >= 2 ? parts[0].substring(2) : parts[0];
  return '${_monthsShort[month - 1]}/$year';
}

String percent(num? value, {int decimals = 0}) {
  if (value == null) return '—';
  return '${formatQuantity(value, decimals: decimals)}%';
}

String plural(int count, String singular, String pluralForm) =>
    count == 1 ? singular : pluralForm;
