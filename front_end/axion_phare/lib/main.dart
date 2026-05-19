import 'package:axion_phare/telas/home.dart';
import 'package:flutter/material.dart';
import 'package:axion_phare/telas/inicio.dart';
import 'package:axion_phare/telas/home.dart'; // sistema de teste

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Axion Phare', //titulo da janela -- serve mais no pc
      theme: ThemeData(
        fontFamily: 'GolosText',
      ), // fonte geral não precisa mudar de um a um
      debugShowCheckedModeBanner: false,
      home: Home(), // precisa ser Home() se não estiver favor alterar
      // home: CriarConta(), // sistema de teste
    );
  }
}
