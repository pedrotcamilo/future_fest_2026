import 'package:flutter/material.dart';

Widget CustomOutlinedButton(
  String nome,
  VoidCallback onPressed, {
  Color colorButton = const Color(0xffd8d8d8),
}) {
  return Container(
    child: OutlinedButton(
      onPressed: onPressed,
      /* quando desativar o onPressed fica null */
      child: Text(
        nome,
        style: TextStyle(
          color: colorButton,
          fontSize: 14,
          fontWeight: FontWeight(500),
        ),
      ),
    ),
  );
}

Widget buttonArrow(
  VoidCallback onPressed, {
  Color colorButton = const Color.fromARGB(0, 0, 0, 0),
  Color coloricon = const Color.fromARGB(255, 0, 0, 0),
}) {
  return SizedBox(
    width: 133,
    height: 124,
    child: ElevatedButton(
      onPressed: onPressed, // quando desativar o onPressed fica null
      style: ElevatedButton.styleFrom(
        backgroundColor: colorButton,
        elevation: 100000, // cada maior o numero mais suave o click fica
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(topLeft: Radius.circular(50)),
        ),
      ),
      child: Center(
        child: Icon(Icons.arrow_forward_rounded, color: coloricon, size: 48),
      ),
    ),
  );
}

Widget buttonText(
  String nome,
  VoidCallback onPressed, {
  Color colorButton = const Color(0xffd8d8d8),
}) {
  return Column(
    children: [
      TextButton(
        onPressed: onPressed,
        /* quando desativar o onPressed fica null */
        child: Text(
          nome,
          style: TextStyle(
            color: colorButton,
            fontSize: 14,
            fontWeight: FontWeight(500),
          ),
        ),
      ),
      SizedBox(height: 26),
    ],
  );
}
