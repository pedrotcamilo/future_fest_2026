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
      body: Stack(
        children: [
          Column(
            children: [
              SizedBox(
                width: MediaQuery.of(context).size.width,
                height: MediaQuery.of(context).size.height,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Image.asset(
                      'assets/images/veio_brincando.png',
                      width: MediaQuery.of(context).size.width * 0.76,
                    ),
                    SizedBox(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Padding(padding: EdgeInsets.only(right: 22, top: 98)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Positioned(
            top: MediaQuery.of(context).size.height * 0.1,
            right: 22,
            child: Image.asset(
              'assets/images/logo_axionphare_preta.png',
              width: MediaQuery.of(context).size.width * 0.31,
            ),
          ),

          // Botão fixo no canto inferior direito
          Positioned(
            bottom: 0,
            right: 0,
            child: buttonArrow(() => proximatela(context)),
          ),
        ],
      ),
    );
  }
}
