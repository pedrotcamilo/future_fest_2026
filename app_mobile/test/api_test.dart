import 'dart:convert';

import 'package:axionphare_glance/api/api_client.dart';
import 'package:axionphare_glance/api/api_exception.dart';
import 'package:axionphare_glance/api/axion_api.dart';
import 'package:axionphare_glance/core/api_config.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

http.Response jsonResponse(Object data, {int status = 200}) {
  return http.Response(
    jsonEncode(data),
    status,
    headers: {'content-type': 'application/json; charset=utf-8'},
  );
}

ApiClient buildClient(
  Future<http.Response> Function(http.Request request) handler, {
  String baseUrl = 'http://localhost:8000',
}) {
  return ApiClient(baseUrl: baseUrl, httpClient: MockClient(handler));
}

void main() {
  group('ApiClient', () {
    test('normaliza a URL base e remove barras finais', () {
      final client = ApiClient(
        baseUrl: 'http://localhost:8000///',
        httpClient: MockClient((_) async => jsonResponse({})),
      );
      expect(client.baseUrl, 'http://localhost:8000');
    });

    test('adiciona esquema quando ausente', () {
      expect(
        ApiConfig.normalizeBaseUrl('10.0.2.2:8000'),
        'http://10.0.2.2:8000',
      );
      expect(ApiConfig.normalizeBaseUrl(''), isNotEmpty);
    });

    test('lê JSON e envia token de autorização', () async {
      late http.Request captured;
      final client = buildClient((request) async {
        captured = request;
        return jsonResponse({'ok': true});
      });
      client.token = 'token-123';

      final result = await client.request('GET', '/teste/');
      expect(result, {'ok': true});
      expect(captured.headers['Authorization'], 'Bearer token-123');
    });

    test('lê respostas text/plain', () async {
      final client = buildClient(
        (_) async =>
            http.Response('Ok', 200, headers: {'content-type': 'text/plain'}),
      );
      final result = await client.request('POST', '/fornecedores/');
      expect(result, 'Ok');
    });

    test('propaga erro de negócio com mensagem da API', () async {
      final client = buildClient(
        (_) async =>
            jsonResponse({'erro': 'Saldo insuficiente no lote'}, status: 400),
      );

      await expectLater(
        client.request('POST', '/estoque/movimentacoes'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.status, 'status', 400)
              .having(
                (e) => e.message,
                'message',
                'Saldo insuficiente no lote',
              ),
        ),
      );
    });

    test('resume erros de validação do FastAPI', () async {
      final client = buildClient(
        (_) async => jsonResponse({
          'detail': [
            {'msg': 'Field required'},
            {'msg': 'invalid input'},
          ],
        }, status: 422),
      );

      await expectLater(
        client.request('GET', '/qualquer'),
        throwsA(
          isA<ApiException>().having(
            (e) => e.message,
            'message',
            'Field required; invalid input',
          ),
        ),
      );
    });

    test('não exige JSON em toda resposta 200', () async {
      final client = buildClient(
        (_) async =>
            http.Response('', 200, headers: {'content-type': 'text/plain'}),
      );
      expect(await client.request('POST', '/auth/logout'), isNull);
    });
  });

  group('AxionApi', () {
    test('login guarda o token e /auth/me devolve usuário', () async {
      final requests = <String>[];
      final client = buildClient((request) async {
        requests.add(request.url.path);
        if (request.url.path == Endpoints.login) {
          return jsonResponse({'status': 'Autenticado', 'token': 'uuid-token'});
        }
        if (request.url.path == Endpoints.me) {
          return jsonResponse({
            'id': 1,
            'nome': 'Administrador',
            'telefone': '-',
            'email': 'admin@localhost',
            'admin': true,
          });
        }
        return jsonResponse({});
      });
      final api = AxionApi(client);

      final token = await api.login('admin@localhost', 'senha');
      expect(token, 'uuid-token');
      expect(client.token, 'uuid-token');

      final user = await api.me();
      expect(user.name, 'Administrador');
      expect(user.admin, isTrue);
      expect(requests, [Endpoints.login, Endpoints.me]);
    });

    test('login inválido lança 401', () async {
      final client = buildClient(
        (_) async => jsonResponse({
          'status': 'Nao autorizado',
          'token': null,
        }, status: 401),
      );

      await expectLater(
        AxionApi(client).login('x', 'y'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.isUnauthorized, 'isUnauthorized', isTrue)
              .having((e) => e.message, 'message', 'Nao autorizado'),
        ),
      );
    });

    test('usa barra final nas rotas de coleção', () async {
      final paths = <String>[];
      final client = buildClient((request) async {
        paths.add(request.url.path);
        return jsonResponse([]);
      });
      final api = AxionApi(client);

      await api.alerts();
      await api.forecasts();
      await api.suggestions();
      await api.purchases();

      expect(paths, [
        '/alertas/',
        '/previsoes/',
        '/sugestoes-compra/',
        '/compras/',
      ]);
    });

    test('consulta alertas com filtro de resolvido', () async {
      late Uri captured;
      final client = buildClient((request) async {
        captured = request.url;
        return jsonResponse([]);
      });

      await AxionApi(client).alerts(resolved: false);
      expect(captured.queryParameters['resolvido'], 'false');
    });

    test('resolve alerta via POST', () async {
      late http.Request captured;
      final client = buildClient((request) async {
        captured = request;
        return http.Response('Ok', 200);
      });

      await AxionApi(client).resolveAlert(7);
      expect(captured.method, 'POST');
      expect(captured.url.path, '/alertas/7/resolver');
    });
  });
}
