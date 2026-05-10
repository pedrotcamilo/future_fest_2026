import 'package:flutter/material.dart';
import 'criar_conta.dart';
import 'widgets/botoes.dart';
import 'widgets/texts.dart';

class TelaLoggin extends StatefulWidget {
  TelaLoggin({super.key});

  final TextEditingController email = TextEditingController();
  final TextEditingController senha = TextEditingController();
  final Color cortexto = const Color(0xffd8d8d8);

  void esqueciSenha() {
    print('esquci minha senha');
  }

  void criarConta(BuildContext context) {
    Navigator.push(
      context,
      PageRouteBuilder(
        // Substitua 'SuaOutraTela' pelo nome da classe da tela de destino
        pageBuilder: (context, animation, secondaryAnimation) => CriarConta(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  void logar() {
    String emailvalue = email.text;
    String senhavalue = senha.text;
    print('loggin com email: $emailvalue e senha: $senhavalue');
  }

  @override
  State<TelaLoggin> createState() => _TelaLogginState();
}

class _TelaLogginState extends State<TelaLoggin> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.only(top: 90),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: double.infinity,
              child: Column(
                children: [
                  Image.asset(
                    'assets/images/logo_axionphare_preta.png',
                    width: 256,
                  ),
                ],
              ),
            ),
            Container(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(height: 37),
                  TextInput('E-Mail', widget.email),
                  TextInput("Senha", widget.senha, hide: true),
                  SizedBox(height: 31),
                  buttonText('Esqueci minha senha', widget.esqueciSenha),
                  buttonText(
                    'Não tenho uma conta',
                    () => widget.criarConta(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                alignment: Alignment.bottomRight,
                child: buttonArrow(
                  widget.logar,
                  colorButton: Color(0xff1351ff),
                  coloricon: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
