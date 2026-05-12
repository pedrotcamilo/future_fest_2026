import 'package:flutter/material.dart';

Widget TextInput(
  String placeholder,
  textediting, {
  bool hide = false,
  Color cortexto = const Color(0xffd8d8d8),
}) {
  return Column(
    children: [
      Padding(
        padding: EdgeInsets.symmetric(horizontal: 60),
        child: TextField(
          controller: textediting,
          obscureText: hide,
          decoration: InputDecoration(
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: cortexto),
            ),
            border: UnderlineInputBorder(
              borderSide: BorderSide(color: cortexto, width: 1),
            ),
            hintStyle: TextStyle(
              color: cortexto,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            hintText: placeholder,
          ),
        ),
      ),
      SizedBox(height: 37),
    ],
  );
}
