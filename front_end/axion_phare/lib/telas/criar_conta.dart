import 'package:flutter/material.dart';
import 'widgets/texts.dart';
import 'widgets/botoes.dart';

class CriarConta extends StatelessWidget {
  CriarConta({super.key});

  final TextEditingController nome = TextEditingController();
  final TextEditingController email = TextEditingController();
  final TextEditingController senha = TextEditingController();
  final Color cortexto = const Color(0xffd8d8d8);

  void criarConta() {
    String nomevalue = nome.text;
    String emailvalue = email.text;
    String senhavalue = senha.text;
    print(
      'criando conta com nome: $nomevalue, email: $emailvalue e senha: $senhavalue',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(58),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: double.infinity,
              child: Column(
                children: [
                  Image.asset(
                    '../assets/images/logo_axionphare_preta.png',
                    width: 256,
                  ),
                ],
              ),
            ),
            Container(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  TextInput('Nome', nome),
                  TextInput('E-Mail', email),
                  TextInput("Senha", senha, hide: true),
                  SizedBox(height: 31),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    /* crossAxisAlignment: CrossAxisAlignment.start, */
                    children: [
                      Icon(
                        Icons.lock_outline_rounded,
                        color: cortexto,
                        size: 14,
                      ),
                      SizedBox(width: 25),
                      Text(
                        style: TextStyle(color: cortexto, fontSize: 10),
                        'As suas informações são privadas e serão salvas \nconforme as leis de privacidade do Brasil.',
                      ),
                    ],
                  ),
                  CustomOutlinedButton("Criar sua conta", criarConta),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
