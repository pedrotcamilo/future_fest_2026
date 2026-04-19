//
// infoUsuario.dart
//
// Pega os dados do usuario, tipo nome e quaisquer dados que for configurar ao passar do tempo.
//

import 'package:shared_preferences/shared_preferences.dart';

Future<void> registrarUsuario(String nome) async {
  final prefs = await SharedPreferences.getInstance();
  prefs.setString("nomeUsuario", nome);
  return;
}

Future<String> receberNomeUsuario() async {
  final prefs = await SharedPreferences.getInstance();
  var nome = prefs.getString("nomeUsuario") ?? "Sem Nome Registrado!";
  return nome;
}