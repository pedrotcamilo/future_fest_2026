/// Leitura defensiva de JSON da API AxionPhare.
///
/// A API pode devolver `"None"` no lugar de `null` em campos de data, expor
/// números como texto e listas em formatos inesperados. Todas as conversões
/// abaixo toleram esses casos.
library;

Object? _clean(Object? value) {
  if (value == null) return null;
  if (value is String && (value == 'None' || value.isEmpty)) return null;
  return value;
}

double? asDouble(Object? value) {
  final cleaned = _clean(value);
  if (cleaned == null) return null;
  if (cleaned is num) return cleaned.toDouble();
  if (cleaned is String) {
    final parsed = double.tryParse(cleaned.replaceAll(',', ''));
    return parsed;
  }
  return null;
}

int? asInt(Object? value) {
  final cleaned = _clean(value);
  if (cleaned == null) return null;
  if (cleaned is int) return cleaned;
  if (cleaned is num) return cleaned.toInt();
  if (cleaned is String) return int.tryParse(cleaned);
  return null;
}

bool? asBool(Object? value) {
  final cleaned = _clean(value);
  if (cleaned == null) return null;
  if (cleaned is bool) return cleaned;
  if (cleaned is num) return cleaned != 0;
  if (cleaned is String) {
    final lower = cleaned.toLowerCase();
    if (lower == 'true' || lower == '1') return true;
    if (lower == 'false' || lower == '0') return false;
  }
  return null;
}

String? asString(Object? value) {
  final cleaned = _clean(value);
  if (cleaned == null) return null;
  return cleaned.toString();
}

/// Datas vêm como `YYYY-MM-DD` ou `YYYY-MM-DD HH:MM:SS` (sem timezone).
DateTime? asDateTime(Object? value) {
  final text = asString(value);
  if (text == null) return null;
  return DateTime.tryParse(text.replaceFirst(' ', 'T'));
}

List<dynamic> asList(Object? value) {
  if (value is List) return value;
  if (value == null) return const [];
  return [value];
}

Map<String, dynamic> asMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return value.map((key, v) => MapEntry(key.toString(), v));
  return const {};
}
