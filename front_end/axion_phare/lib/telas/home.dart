import 'package:flutter/material.dart';
import 'widgets/texts.dart';

class HomeApp extends StatefulWidget {
  const HomeApp({super.key});

  @override
  State<HomeApp> createState() => _HomeAppState();
}

class _HomeAppState extends State<HomeApp> {
  Color cortexto = Color(0xff000000);
  Color corfundo = Color(0xffF0F0F0);
  Color corfundo2 = Color(0xffEAEFFF);
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [corfundo, corfundo2],
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // gambiarra
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(height: 100),
                      texto('Bem-vindo,', 32, peso: 500, cor: cortexto),
                      texto('Pedro', 32, peso: 700, cor: cortexto),
                    ],
                  ),
                  SizedBox(width: MediaQuery.of(context).size.width * 0.69),
                  Image.asset(
                    'assets/images/logo_axionphare_preta.png',
                    width: MediaQuery.of(context).size.width * 0.31,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
