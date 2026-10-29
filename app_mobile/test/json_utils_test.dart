import 'package:axionphare_glance/core/json_utils.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('json_utils', () {
    test('converte números em texto e tolera "None"', () {
      expect(asDouble('12.5'), 12.5);
      expect(asDouble(3), 3.0);
      expect(asDouble('None'), isNull);
      expect(asDouble(''), isNull);
      expect(asInt('42'), 42);
      expect(asInt(7.9), 7);
      expect(asInt('None'), isNull);
    });

    test('converte booleanos', () {
      expect(asBool(true), isTrue);
      expect(asBool('true'), isTrue);
      expect(asBool('false'), isFalse);
      expect(asBool(1), isTrue);
      expect(asBool('None'), isNull);
    });

    test('normaliza datas e strings nulas', () {
      expect(asString('None'), isNull);
      expect(asString('  '), '  ');
      expect(asDateTime('2026-10-29'), DateTime(2026, 10, 29));
      expect(asDateTime('2026-10-29 14:30:00'), DateTime(2026, 10, 29, 14, 30));
      expect(asDateTime('None'), isNull);
    });

    test('tolera listas e mapas inesperados', () {
      expect(asList(null), isEmpty);
      expect(asList({'a': 1}), hasLength(1));
      expect(asMap(null), isEmpty);
      expect(asMap({'a': 1})['a'], 1);
    });
  });
}
