import 'package:flutter/material.dart';

import '../core/state/app_scope.dart';
import '../core/state/reload_controller.dart';
import '../widgets/theme_toggle_button.dart';
import 'alerts_page.dart';
import 'charts_page.dart';
import 'dashboard_page.dart';
import 'more_page.dart';
import 'replenishment_page.dart';
import 'settings_page.dart';
import 'stock_page.dart';

/// Casca principal com navegação entre as áreas do app.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  static const _titles = [
    'Visão geral',
    'Estoque',
    'Gráficos',
    'Alertas',
    'Mais',
  ];

  final ReloadController _reload = ReloadController();
  final Set<int> _visited = {0};
  int _index = 0;

  @override
  void dispose() {
    _reload.dispose();
    super.dispose();
  }

  void _select(int index) {
    if (index == _index) return;
    setState(() {
      _index = index;
      _visited.add(index);
    });
  }

  void _push(Widget page) {
    Navigator.of(context)
        .push(MaterialPageRoute<void>(builder: (context) => page));
  }

  Widget _pageAt(int index) {
    if (!_visited.contains(index)) return const SizedBox.shrink();
    final services = AppScope.of(context);
    return switch (index) {
      0 => DashboardPage(
        repository: services.repository,
        reload: _reload,
        onOpenStock: () => _select(1),
        onOpenCharts: () => _select(2),
        onOpenAlerts: () => _select(3),
        onOpenReplenishment: () => _push(const ReplenishmentPage()),
      ),
      1 => StockPage(repository: services.repository, reload: _reload),
      2 => ChartsPage(repository: services.repository, reload: _reload),
      3 => AlertsPage(repository: services.repository, reload: _reload),
      4 => MorePage(
        repository: services.repository,
        reload: _reload,
        onOpenSettings: () => _push(const SettingsPage()),
        onOpenReplenishment: () => _push(const ReplenishmentPage()),
      ),
      _ => const SizedBox.shrink(),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            tooltip: 'Atualizar dados',
            icon: const Icon(Icons.refresh),
            onPressed: _reload.trigger,
          ),
          const ThemeToggleButton(),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: [for (var i = 0; i < _titles.length; i++) _pageAt(i)],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _select,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Visão geral',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Estoque',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Gráficos',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_outlined),
            selectedIcon: Icon(Icons.notifications),
            label: 'Alertas',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz_outlined),
            selectedIcon: Icon(Icons.more_horiz),
            label: 'Mais',
          ),
        ],
      ),
    );
  }
}
