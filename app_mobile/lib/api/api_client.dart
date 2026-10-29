import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/api_config.dart';
import 'api_exception.dart';

/// Cliente HTTP de baixo nível da API AxionPhare.
///
/// - envia `Authorization: Bearer` quando há token;
/// - trata respostas JSON, texto puro (`Ok`) e erros;
/// - nunca assume que todo `200` é JSON.
class ApiClient {
  ApiClient({
    required String baseUrl,
    http.Client? httpClient,
    this.timeout = const Duration(seconds: 20),
  }) : _baseUrl = ApiConfig.normalizeBaseUrl(baseUrl),
       _http = httpClient ?? http.Client();

  final http.Client _http;
  final Duration timeout;

  String _baseUrl;
  String? token;

  String get baseUrl => _baseUrl;

  set baseUrl(String value) => _baseUrl = ApiConfig.normalizeBaseUrl(value);

  /// Executa uma requisição e devolve JSON (`Map`/`List`) ou texto.
  Future<dynamic> request(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    Duration? requestTimeout,
  }) async {
    final Uri uri;
    try {
      uri = Uri.parse('$_baseUrl$path').replace(
        queryParameters: (query == null || query.isEmpty) ? null : query,
      );
    } on FormatException {
      throw ApiException(
        0,
        null,
        customMessage: 'Endereço do servidor inválido.',
      );
    }

    final request = http.Request(method, uri);
    request.headers['Accept'] = 'application/json, text/plain, */*';
    if (token != null && token!.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    final http.Response response;
    try {
      final streamed = await _http
          .send(request)
          .timeout(requestTimeout ?? timeout);
      response = await http.Response.fromStream(streamed)
          .timeout(requestTimeout ?? timeout);
    } on TimeoutException {
      throw ApiException(
        0,
        null,
        customMessage: 'O servidor demorou para responder. Tente novamente.',
      );
    } on http.ClientException {
      throw ApiException(
        0,
        null,
        customMessage:
            'Não foi possível conectar a $_baseUrl. '
            'Verifique o endereço e se o servidor está ativo.',
      );
    } catch (error) {
      if (error is ApiException) rethrow;
      throw ApiException(
        0,
        null,
        customMessage: 'Falha de conexão com o servidor: $error',
      );
    }

    final contentType = response.headers['content-type'] ?? '';
    dynamic data;
    if (response.body.isEmpty) {
      data = null;
    } else if (contentType.contains('application/json')) {
      try {
        data = jsonDecode(response.body);
      } on FormatException {
        data = response.body;
      }
    } else {
      data = response.body;
    }

    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, data);
    }
    return data;
  }

  void close() => _http.close();
}
