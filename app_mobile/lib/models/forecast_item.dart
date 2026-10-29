import '../core/json_utils.dart';

/// Previsão de consumo (`GET /previsoes/`).
class ForecastItem {
  const ForecastItem({
    required this.id,
    required this.materialId,
    required this.forecastDate,
    required this.periodStart,
    required this.periodEnd,
    required this.forecastConsumption,
    required this.confidence,
    required this.model,
  });

  final int id;
  final int? materialId;
  final DateTime? forecastDate;
  final DateTime? periodStart;
  final DateTime? periodEnd;
  final double forecastConsumption;
  final double? confidence;
  final String? model;

  factory ForecastItem.fromJson(Map<String, dynamic> json) {
    return ForecastItem(
      id: asInt(json['id']) ?? 0,
      materialId: asInt(json['materia_prima_id']),
      forecastDate: asDateTime(json['data_previsao']),
      periodStart: asDateTime(json['periodo_inicio']),
      periodEnd: asDateTime(json['periodo_fim']),
      forecastConsumption: asDouble(json['consumo_previsto']) ?? 0,
      confidence: asDouble(json['confianca']),
      model: asString(json['modelo_utilizado']),
    );
  }

  static List<ForecastItem> listFrom(Object? value) =>
      asList(value)
          .map((item) => ForecastItem.fromJson(asMap(item)))
          .toList(growable: false);
}
