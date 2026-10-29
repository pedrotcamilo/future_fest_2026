import 'dart:async';

import 'package:flutter/widgets.dart';

/// Sinaliza às páginas ativas que devem recarregar os dados.
class ReloadController extends ChangeNotifier {
  void trigger() => notifyListeners();
}

/// Estado de página que recarrega ao receber [ReloadController.trigger].
abstract class ReloadAwareState<T extends StatefulWidget> extends State<T> {
  ReloadController get reloadController;

  Future<void> refresh();

  @override
  void initState() {
    super.initState();
    reloadController.addListener(_handleReload);
  }

  void _handleReload() {
    if (mounted) unawaited(refresh());
  }

  @override
  void dispose() {
    reloadController.removeListener(_handleReload);
    super.dispose();
  }
}
