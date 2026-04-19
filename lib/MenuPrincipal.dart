import 'package:flutter/material.dart';
import 'cores.dart';
import 'backend/infoUsuario.dart';

class MenuPrincipal extends StatefulWidget {
  const MenuPrincipal({super.key});

  @override
  State<MenuPrincipal> createState() => _MenuPrincipalState();
}

class _MenuPrincipalState extends State<MenuPrincipal> {
  String nomeUsuario = "CARREGANDO...";

  @override
  void initState() {
    super.initState();
    carregarNome();
  }

  void carregarNome() async {
    String nome = await receberNomeUsuario();
    setState(() {
      nomeUsuario = nome.toUpperCase(); // Carrega o nome do usuário usando minha função mal feita
    });
  }

  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        appBar: AppBar(
          toolbarHeight: 120.0,
          backgroundColor: fgColorGlobal,
          centerTitle: true,
          title: Image.asset("assets/logo_eurofarma.png", height: 65.0),
        ),
        body: Padding(
          padding: EdgeInsetsGeometry.all(25),
          child: Column(
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        "Olá!",
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(width: 10),
                      Text(
                        nomeUsuario,
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    "Selecione uma opção para continuar...",
                    style: TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
                  ),
                ],
              ),
              SizedBox(height: 50.0),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      buildCard(
                        fgColor: fgColorGlobal,
                        icon: Icons.alarm,
                        text: "Lembretes",
                      ),
                      buildCard(
                        fgColor: fgColorGlobal,
                        icon: Icons.image,
                        text: "Escanear",
                      ),
                    ],
                  ),
                  buildExtendedCard(
                    fgColor: fgColorGlobal,
                    icon: Icons.inbox,
                    text: "Ver bulas salvas",
                  ),
                ],
              ),
            ],
          ),
        ),
        bottomNavigationBar: BottomAppBar(
          color: Colors.transparent,
          child: Column(
            children: [
              Text("© EuroFarma (1972-2026)"),
              Text("Desenvolvido por AxionPhare"),
            ],
          ),
        ),
      ),
    );
  }
}

Widget buildCard({
  required Color fgColor,
  required IconData icon,
  required String text,
  VoidCallback? onTap,
}) {
  return Card(
    color: fgColor,
    clipBehavior: Clip.hardEdge,
    child: InkWell(
      splashColor: fgColor.withAlpha(30),
      onTap: onTap,
      child: SizedBox(
        width: 190,
        height: 190,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 128),
            Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 24.0),
            ),
          ],
        ),
      ),
    ),
  );
}

Widget buildExtendedCard({
  required Color fgColor,
  required IconData icon,
  required String text,
  VoidCallback? onTap,
}) {
  return Card(
    color: fgColor,
    clipBehavior: Clip.hardEdge,
    child: InkWell(
      splashColor: fgColor.withAlpha(30),
      onTap: onTap,
      child: SizedBox(
        width: 380,
        height: 190,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 128),
            SizedBox(width: 20),
            Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 24.0),
            ),
          ],
        ),
      ),
    ),
  );
}
