import 'package:axion_phare/telas/home.dart';
import 'package:flutter/material.dart';
import 'criar_conta.dart';
import 'home.dart';
import 'alterar_senha.dart';
import 'widgets/botoes.dart';
import 'widgets/texts.dart';

class TelaLogin extends StatefulWidget {
  TelaLogin({super.key});

  @override
  State<TelaLogin> createState() => _TelaLoginState();
}

class _TelaLoginState extends State<TelaLogin> {
  final TextEditingController email = TextEditingController(); //controler don inputs -- adicionar o sistema de salvamento
  final TextEditingController senha = TextEditingController();
  final Color cortexto = const Color(
    0xffd8d8d8,
  ); // imutavel serve para facilitar a mudança de cor do texto

  Color CorTextInput = const Color(0xffd8d8d8); // sistema de cor para erros
  String textoErro = ''; // mostra a mensagem de erro

  void esqueciSenha() {
    Navigator.push(
      context,
      PageRouteBuilder(
        // Substitua 'SuaOutraTela' pelo nome da classe da tela de destino
        pageBuilder: (context, animation, secondaryAnimation) => TelaAlterarSenha(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          //animação de transição entre telas
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
    print(
      'esquci minha senha',
    ); // adicionar tela de recuperação de senha depois
  }

  void criarConta(BuildContext context) {
    // sistema de trocar de tela com animação, para criar conta
    Navigator.push(
      context,
      PageRouteBuilder(
        // Substitua 'SuaOutraTela' pelo nome da classe da tela de destino
        pageBuilder: (context, animation, secondaryAnimation) => CriarConta(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          //animação de transição entre telas
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  void logar() {
    String emailvalue = email.text;
    String senhavalue = senha.text;
    if (emailvalue.isEmpty || senhavalue.isEmpty) {
      setState(() {
        textoErro = 'Preencha todos os campos';
        CorTextInput = Colors.red;
      });
    } else {
      var re = RegExp(r"/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/");

      if (!re.hasMatch(emailvalue)) {
        setState(() {
          textoErro = 'E-Mail invalido';
          CorTextInput = Colors.red;
        });
        return;
      }
      setState(() {
        textoErro = '';
        CorTextInput = const Color(0xffd8d8d8);
        Navigator.push(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnomation) => HomeApp(),
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
                  return FadeTransition(opacity: animation, child: child);
                },
          ),
        );
      });
    }
  } // Pedro para de revisar o código
    // não - 11 de junho de 2026 as 08:49

  @override // daqui pra frente é o sistema de construção da janela.
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset:
          false, // para evitar que o teclado mova os elementos da tela
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.only(top: 90),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  height: MediaQuery.of(context).size.height - 90,
                  width: MediaQuery.of(context).size.width,
                  child: Column(
                    children: [
                      Image.asset(
                        'assets/images/logo_axionphare_preta.png',
                        width: 256,
                      ),
                      SizedBox(height: 37),
                      TextInput('E-Mail', email, cortexto: CorTextInput),
                      TextInput(
                        "Senha",
                        senha,
                        hide: true,
                        cortexto: CorTextInput,
                      ),
                      Text(textoErro, style: TextStyle(color: CorTextInput)),
                      SizedBox(height: 0),
                      buttonText('Esqueci minha senha', esqueciSenha),
                      buttonText(
                        'Não tenho uma conta',
                        () => criarConta(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Botão fixo no fundo da tela
          Positioned(
            bottom: 0,
            right: 0,
            child: buttonArrow(
              logar,
              colorButton: Color(0xff1351ff),
              coloricon: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}