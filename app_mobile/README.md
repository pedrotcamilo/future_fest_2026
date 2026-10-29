# AxionPhare Glance

Aplicativo Flutter de leitura rápida (“glance”) para o sistema **AxionPhare** de gestão de
farmácias de manipulação. Consome a API REST do servidor AxionPhare, mostra os principais
indicadores da operação, gráficos e alertas, com tema Material 3 claro/escuro.

O servidor se identifica em `GET /diagnosticos/axionphare_desktop`; o app exibe essa identidade
(`intendidade`/`empresa`) na tela de login e na aba **Mais**.

## O que o app faz

| Área | Conteúdo | Endpoints principais |
|---|---|---|
| **Visão geral** | KPIs (matérias-primas, compras pendentes, ordens em produção, alertas ativos), estoque crítico, alertas recentes e resumo operacional | `/dashboard/`, `/dashboard/compras`, `/dashboard/producao`, `/dashboard/previsoes`, `/dashboard/alertas`, `/estoque/`, `/materias-primas/`, `/alertas/` |
| **Estoque** | Lista de matérias-primas com saldo consolidado, mínimo/máximo, busca e filtro “abaixo do mínimo” | `/estoque/`, `/materias-primas/` |
| **Gráficos** | Consumo mensal (todas ou por matéria-prima), estoque atual, entradas/saídas por mês, status de compras/produção e consumo previsto | `/materias-primas/`, `/estoque/`, `/estoque/movimentacoes`, `/previsoes/`, `/dashboard/*` |
| **Alertas** | Filtros por em aberto/alta prioridade/todos e ação de resolver | `/alertas/`, `/alertas/{id}/resolver` |
| **Mais** | Identidade do servidor, status do banco (primário/Supabase), informações do host, sessão, atalhos | `/diagnosticos/axionphare_desktop`, `/diagnosticos/status_banco`, `/diagnosticos/informacao_servidor` |
| **Reposição** | Previsões de consumo e sugestões de compra, com aprovar/rejeitar | `/previsoes/`, `/sugestoes-compra/`, `/sugestoes-compra/{id}/aprovar|rejeitar` |
| **Configurações** | Tema claro/escuro/sistema, URL da API com teste de conexão, sessão | — |

O login usa `POST /auth/login` e guarda o token em armazenamento seguro. Como a API é pública para
consulta, o app também oferece **“Continuar sem login”** (modo visitante). Ações de escrita
disponíveis são apenas resolver alerta e aprovar/rejeitar sugestão.

## Requisitos

- Flutter 3.35+ (projeto validado com Flutter 3.47 / Dart 3.13)
- Servidor AxionPhare acessível (padrão `http://localhost:8000`)

## Como rodar

```bash
cd app_mobile
flutter pub get
flutter run
```

### URL do servidor

O endereço pode ser alterado na tela de login (seção **Servidor**) ou em **Mais → Configurações**.
Ele é salvo localmente.

| Alvo | URL padrão |
|---|---|
| Emulador Android | `http://10.0.2.2:8000` |
| iOS/desktop | `http://localhost:8000` |
| Dispositivo físico | `http://<IP-LAN-da-máquina>:8000` (informe manualmente) |
| Flutter Web | `http://localhost:8000` (requer CORS ou proxy no backend) |

> Em desenvolvimento o Android está com `usesCleartextTraffic="true"` e o iOS com
> `NSAllowsArbitraryLoads` para permitir HTTP. Em produção, use HTTPS e remova essas permissões.

### Teste rápido de conectividade

```bash
curl http://localhost:8000/diagnosticos/axionphare_desktop
curl http://localhost:8000/diagnosticos/status_banco
curl http://localhost:8000/dashboard/
```

## Estrutura de `lib/`

```
lib/
├── main.dart                  # bootstrap: prefs, cliente HTTP, sessão, runApp
├── app.dart                   # MaterialApp, temas e troca login/shell
├── api/                       # cliente HTTP e operações da API
│   ├── api_client.dart        # JSON/texto, Bearer, timeout, barra final
│   ├── api_exception.dart     # mensagens de erro (400/401/422…)
│   └── axion_api.dart         # um método por endpoint usado
├── assets/                    # caminhos de assets (logo)
├── core/
│   ├── analytics.dart         # agregações puras para os gráficos
│   ├── api_config.dart        # URLs padrão + catálogo de endpoints
│   ├── formatters.dart        # números pt-BR, datas e meses
│   ├── json_utils.dart        # parsing tolerante (“None”, numéricos em texto)
│   ├── state/                 # escopo, sessão, preferências, reload
│   └── theme/                 # ThemeData Material 3 claro/escuro
├── models/                    # entidades da API (fromJson)
├── pages/                     # login, shell, dashboard, estoque, gráficos…
├── services/                  # repositório, snapshots e token store
└── widgets/                   # cards, chips, estados e gráficos (fl_chart)
assets/branding/               # logo do app (PNG/SVG)
```

- **Sem paginação na API:** as listas são carregadas completas e filtradas no cliente.
- **Gráficos:** `fl_chart` (linha, barra e pizza); o PNG de `/graficos/consumo` não é usado.
- **Estado:** `ChangeNotifier` + `InheritedWidget` (`AppScope`), sem framework extra.
- **Persistência:** `shared_preferences` (tema/URL) e `flutter_secure_storage` (token).

## Testes

```bash
flutter analyze
flutter test
```

Os testes cobrem parsing tolerante, formatação, agregações dos gráficos, cliente HTTP
(JSON/texto/erros/token), o fluxo básico da tela de login/tema e a renderização das páginas
principais em tela estreita (390×844, com cliente HTTP simulado).

Teste opcional contra um servidor real:

```bash
flutter test test/live_api_test.dart \
  --dart-define=AXION_BASE_URL=http://localhost:8000
```

Build web (usado para validar compilação):

```bash
flutter build web
```

## Cuidados com a API

O app já trata as principais armadilhas documentadas em `RELATORIO_API_CLIENTE.md`:

- barra final obrigatória nas rotas de coleção (`/alertas/`, `/previsoes/`, …);
- respostas `text/plain` (`Ok`) e JSON no mesmo servidor;
- datas nulas que chegam como a string `"None"`;
- erros de validação `{"detail": [...]}` e regra de negócio `{"erro": "..."}`;
- token em memória no servidor (restart invalida a sessão);
- **usuário demo (id 5) reseta o banco no login** — não use atalhos para ele nem faça login
  demo em ambiente com dados reais;
- endpoint de IA `/estoque/gerar_predicacao_compra` não é chamado (pode levar ~60 s).

O backend não configura CORS: builds web em outra origem precisam de proxy reverso ou middleware
no servidor. Android/iOS/desktop não são afetados por CORS.

## Limitações

Este app é intencionalmente um painel de leitura. Não cria compras, pedidos, lotes, fórmulas ou
movimentações. Para essas operações, use a SPA em `/web` ou a API diretamente.
