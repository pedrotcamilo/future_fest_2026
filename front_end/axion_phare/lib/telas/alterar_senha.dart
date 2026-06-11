import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'widgets/botoes.dart';
import 'widgets/texts.dart';

import '../vars.dart';

class TelaAlterarSenha extends StatefulWidget {
  TelaAlterarSenha({super.key});

  @override
  State<StatefulWidget> createState() => _TelaAlterarSenhaState();
}

class _TelaAlterarSenhaState extends State<TelaAlterarSenha> {
  Color CorTextInput = const Color(0xffd8d8d8);
  Color CorInfo = Color(0xff3DC346);
  String textoInfo = "";
  bool codigoEnviado = false;
  final email = TextEditingController();
  final codigo = TextEditingController();
  final nova_senha = TextEditingController();

  var reEmail = RegExp(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

  void btnAlterarSenha() async {
    String emailVal = email.text;
    String codigoVal = codigo.text;
    String novaSenhaVal = nova_senha.text;
    var client = http.Client();

    setState(() {
      CorInfo = Color(0xff3DC346);
    });

    if (!codigoEnviado) {

      if (emailVal.isEmpty || !reEmail.hasMatch(emailVal)) {
        setState(() {
          textoInfo = "Insira um E-mail válido";
          CorInfo = Color(0xffC33D3D);
        });
      } else {
        try {
          var response = await client.post(
            Uri.http(
              enderecoServer,
              "solicitarResetSenha",
              {
                'email': emailVal
              }
            ),
          );
          var codigoStatus = response.statusCode;

          if (codigoStatus != 200) {
            setState(() {
              textoInfo = "Houve um erro ao processar a solicitação";
              CorInfo = Color(0xffC33D3D);
            });
            print("Erro $codigoStatus: ${response.body}");
          } else {
            setState(() {
              textoInfo = "Código enviado!";
            });
            codigoEnviado = true;
          }
        } catch(e) {
          print(e);
        }
      }
    } else {
      try {
        var response = await client.post(
          Uri.http(
              enderecoServer,
              "resetarSenha",
              {
                'email': emailVal,
                'codReset': codigoVal,
                'senha_nova': novaSenhaVal
              }
          ),
        );

        var codigoStatus = response.statusCode;

        switch(codigoStatus) {
          case 200:
            setState(() {
              textoInfo = "Senha alterada!";
            });

          case 400:
            setState(() {
              textoInfo = "Código invalido";
              CorInfo = Color(0xffC33D3D);
            });

          default:
            setState(() {
              textoInfo = "Erro interno";
              CorInfo = Color(0xffC33D3D);
            });
        }
      } catch (e) {
        print(e);
      }
    }
  }
  
  void btnCancelar() {
    Navigator.of(context).pop();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.only(top: 90),
            child: Column(
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
                      TextInput('E-Mail', email, cortexto: CorTextInput),
                      TextInput('Código', codigo, cortexto: CorTextInput),
                      TextInput('Nova Senha', nova_senha, cortexto: CorTextInput, hide: true),
                      Text(
                        style: TextStyle(color: CorInfo, fontSize: 15),
                        textoInfo,
                      ),
                      SizedBox(height: 27),
                      Text(
                        style: TextStyle(color: CorTextInput, fontSize: 12),
                        'Caso haja um e-mail válido, um código chegará,\npreencha-o neste formulário, nunca compartilhe-o.',
                      ),
                      SizedBox(height: 52),
                      CustomOutlinedButton("Alterar Senha", btnAlterarSenha),
                      SizedBox(height: 10),
                      buttonText("Retornar", btnCancelar)
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