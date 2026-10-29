/// Erro devolvido pela API AxionPhare ou falha de transporte.
class ApiException implements Exception {
  ApiException(this.status, this.body, {this.customMessage});

  /// Código HTTP. `0` indica falha de rede/timeout.
  final int status;
  final dynamic body;
  final String? customMessage;

  bool get isNetworkError => status == 0;
  bool get isUnauthorized => status == 401;
  bool get isForbidden => status == 403;
  bool get isValidationError => status == 422;

  String get message {
    final custom = customMessage;
    if (custom != null && custom.isNotEmpty) return custom;
    final extracted = _extractMessage(body);
    if (extracted != null && extracted.isNotEmpty) return extracted;
    if (status == 0) return 'Falha de conexão com o servidor.';
    return 'Erro HTTP $status';
  }

  static String? _extractMessage(Object? data) {
    if (data == null) return null;
    if (data is String) {
      final trimmed = data.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    if (data is Map) {
      final error = data['erro'];
      if (error is String && error.isNotEmpty) return error;
      final status = data['status'];
      if (status is String && status.isNotEmpty) return status;
      final detail = data['detail'];
      if (detail is String && detail.isNotEmpty) return detail;
      if (detail is List) {
        final messages = detail
            .map(
              (item) =>
                  item is Map ? item['msg']?.toString() : item?.toString(),
            )
            .whereType<String>()
            .where((text) => text.isNotEmpty)
            .toList();
        if (messages.isNotEmpty) return messages.join('; ');
      }
    }
    return null;
  }

  @override
  String toString() => message;
}
