import 'package:flutter/material.dart';
import 'widgets/botoes.dart';
import 'loggin.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  void proximatela(BuildContext context) {
    Navigator.push(
      context,
      PageRouteBuilder(
        // Substitua 'SuaOutraTela' pelo nome da classe da tela de destino
        pageBuilder: (context, animation, secondaryAnimation) => TelaLoggin(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: MediaQuery.of(context).size.height,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Image.asset('assets/images/veio_brincando.png', width: 270),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Padding(
                        padding: EdgeInsets.only(right: 22, top: 98),
                        child: Column(
                          children: [
                            Image.asset(
                              'assets/images/logo_axionphare_preta.png',
                              width: 100,
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [buttonArrow(() => proximatela(context))],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
