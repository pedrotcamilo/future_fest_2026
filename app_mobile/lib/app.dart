import 'package:flutter/material.dart';

import 'core/api_config.dart';
import 'core/state/app_scope.dart';
import 'core/state/app_services.dart';
import 'core/theme/app_theme.dart';
import 'pages/home_shell.dart';
import 'pages/login_page.dart';
import 'widgets/brand_mark.dart';

class AxionGlanceApp extends StatelessWidget {
  const AxionGlanceApp({super.key, required this.services});

  final AppServices services;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      services: services,
      child: ListenableBuilder(
        listenable: Listenable.merge([services.preferences, services.session]),
        builder: (context, _) {
          return MaterialApp(
            title: ApiConfig.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: services.preferences.themeMode,
            home: _rootWidget(),
          );
        },
      ),
    );
  }

  Widget _rootWidget() {
    if (services.session.booting) {
      return const _SplashPage();
    }
    if (services.session.isActive) {
      return const HomeShell();
    }
    return const LoginPage();
  }
}

class _SplashPage extends StatelessWidget {
  const _SplashPage();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandMark(size: 72),
            const SizedBox(height: 16),
            Text(ApiConfig.appName, style: theme.textTheme.titleLarge),
            const SizedBox(height: 24),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
            const SizedBox(height: 12),
            Text('Conectando ao servidor…', style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
