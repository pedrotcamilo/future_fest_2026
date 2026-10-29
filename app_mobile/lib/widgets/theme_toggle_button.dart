import 'package:flutter/material.dart';

import '../core/state/app_scope.dart';

/// Alterna entre tema claro e escuro na AppBar.
class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final preferences = AppScope.of(context).preferences;
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;
    return IconButton(
      tooltip: isDark ? 'Usar tema claro' : 'Usar tema escuro',
      icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
      onPressed: () => preferences.toggleBrightness(brightness),
    );
  }
}
