import 'package:flutter/material.dart';
import 'widgets/texts.dart';
import 'widgets/botoes.dart';

class CriarConta extends StatefulWidget {
  // trocar para full e adaptar
  CriarConta({super.key});

  @override
  State<CriarConta> createState() => _CriarContaState();
}

class _CriarContaState extends State<CriarConta> {
  final TextEditingController nome = TextEditingController();
  final TextEditingController email = TextEditingController();
  final TextEditingController senha = TextEditingController();
  final Color cortexto = const Color(0xffd8d8d8);
  String textoerro = '';
  Color CorInput = const Color(0xffd8d8d8);

  void criarConta() {
    String nomevalue = nome.text;
    String emailvalue = email.text;
    String senhavalue = senha.text;
    if (nomevalue.isEmpty || emailvalue.isEmpty || senhavalue.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Campos faltando.'),
          duration: const Duration(seconds: 2),
        ),
      );
      setState(() {
        textoerro = 'Preencha todos os campos';
        CorInput = const Color.fromRGBO(255, 0, 0, 100);
      });
    } else {
      setState(() {
        textoerro = '';
        CorInput = Color(0xFFd8d8d8);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: SingleChildScrollView(
        padding: EdgeInsets.only(top: 58),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: MediaQuery.of(context).size.width,
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
                  TextInput('Nome', nome, cortexto: CorInput),
                  TextInput('E-Mail', email, cortexto: CorInput),
                  TextInput("Senha", senha, hide: true, cortexto: CorInput),
                  Text(textoerro, style: TextStyle(color: CorInput)),
                  SizedBox(height: 15),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    /* crossAxisAlignment: CrossAxisAlignment.start, */
                    children: [
                      Icon(
                        Icons.lock_outline_rounded,
                        color: cortexto,
                        size: 14,
                      ),
                      SizedBox(width: 15),
                      Text(
                        style: TextStyle(color: cortexto, fontSize: 10),
                        'As suas informações são privadas e serão salvas \nconforme as leis de privacidade do Brasil.',
                      ),
                    ],
                  ),
                  SizedBox(height: 24),
                  CustomOutlinedButton("Criar sua conta", criarConta),
                  SizedBox(height: 11),
                  buttonText('Cancelar', () => Navigator.pop(context)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
