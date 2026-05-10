import 'package:flutter/material.dart';
import 'package:axion_phare/telas/inicio.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Axion Phare',
      theme: ThemeData(fontFamily: 'GolosText'),
      debugShowCheckedModeBanner: false,
      home: Home(),
    );
  }
}
