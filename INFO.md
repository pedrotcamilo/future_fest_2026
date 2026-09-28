# AxionPhare — Sistema de Gestão de Estoque para Farmácia de Manipulação

## Visão Geral

O **AxionPhare** é um sistema de gestão de estoque voltado para **farmácias de manipulação de pequeno porte**. Ele cobre todo o ciclo operacional de uma farmácia magistral: cadastro de matérias-primas, controle de lotes por validade, compras de fornecedores, fórmulas magistrais, pedidos de clientes, ordens de produção, consumo de insumos, movimentações de estoque e geração de previsões e sugestões de compra.

O núcleo é um **monolito com SPA (Single Page Application)**: o backend em Python (FastAPI) serve tanto a API REST quanto os arquivos estáticos do frontend (HTML/CSS/JS), consumidos por uma interface web responsiva com Bootstrap 5 e gráficos ApexCharts.

Além do sistema, o repositório abriga dois subprojetos front-end (site institucional e slides de apresentação) e um script SQL único de instalação do banco.

O projeto é um trabalho acadêmico do **FIAP 2026** (nome do repositório: `future_fest_2026`, branch principal de desenvolvimento: `dev`).

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Backend | Python 3.14 (app) / 3.12 (padrão do compose), FastAPI, Uvicorn |
| ORM / Banco | SQLAlchemy 2.0 + psycopg, PostgreSQL 16 |
| Banco (fallback) | Supabase (REST) com failover automático a partir do Postgres local |
| Autenticação | `pwdlib` (Argon2/Bcrypt) para senhas; tokens de sessão em memória |
| Gráficos no backend | pandas + matplotlib (backend `Agg`), retorna PNG |
| Frontend | HTML, CSS, JavaScript puro, Bootstrap 5 (CDN), Bootstrap Icons, ApexCharts (CDN) |
| Site institucional | React 19 + Vite 8 + Sass (`site-axionphare/`) |
| Slides | React 19 + Vite 6 + servidor Express/`pg`/`ssh2` (`slides_bg/`) |
| Infraestrutura | Docker + Docker Compose (PostgreSQL + aplicação), variáveis via `.env` |
| Gerenciamento de deps | `uv` (`src/pyproject.toml` + `src/uv.lock`); há também `src/requirements.txt` para `pip` |

---

## Estrutura do Repositório

```
future_fest_2026/
├── docker-compose.yml       # Orquestra PostgreSQL + app (tudo via .env)
├── Dockerfile               # Build com uv (sync do pyproject/uv.lock)
├── .env.example             # Exemplo das variáveis do compose
├── docker/init.sql          # Apenas o seed de demonstração (não cria schema)
├── setup_completo.sql       # Script ÚNICO de instalação: limpeza → tabelas →
│                            # views → trigger → índices → seed
├── INFO.md / INFO_GERAL.md  # Documentação técnica e material de divulgação
├── testes/
│   ├── limpar_banco.sql     # Trunca tabelas (exceto usuarios)
│   └── seed_dados_teste.sql # Dados fictícios (igual ao seed do demo)
├── site-axionphare/         # Site institucional (React + Vite + Sass)
├── slides_bg/               # Slides da apresentação (React + Vite + server Node)
├── cartoes/                 # Arte do cartão (PNG/PSD)
└── src/
    ├── main.py              # Entrada do FastAPI: registra 19 routers + serve /web
    ├── pyproject.toml       # Dependências (uv)
    ├── api/
    │   ├── routes/          # 19 arquivos de rotas REST
    │   └── services/        # Camada de acesso a dados (SQLAlchemy + failover)
    │       ├── database_manager.py  # engine primário, Supabase e get_session()
    │       ├── models.py            # mapeamento ORM (18 entidades)
    │       ├── views.py             # cria as views na subida da API
    │       └── dependencies/seed_demo.sql  # seed executado no login demo
    ├── sql/                 # 24 scripts SQL (DDL por tabela, views, índices, trigger)
    ├── docs/api_endpoints.md# Documentação dos endpoints
    └── web/                 # Frontend (login + app + tema)
        ├── tema.js          # Preferências do usuário (carregado no <head>)
        ├── login/           # Tela de login
        └── app/             # SPA
            └── js/
                ├── api/     # Camada de chamadas HTTP (client, dashboard, cadastros…)
                ├── core/    # charts, ui, inactivity
                └── pages/   # 17 páginas (render*)
```

---

## Arquitetura

A arquitetura segue o padrão **Router → Service → ORM**, com uma camada extra de resiliência:

- **`api/routes/*.py`** — definem os endpoints HTTP (FastAPI `APIRouter`), recebem/validam payloads (Pydantic) e retornam respostas.
- **`api/services/database_*.py`** — camada de banco: funções que abrem sessão (`get_session()`), executam consultas e retornam dados já serializados.
- **`api/services/models.py`** — mapeamento ORM das tabelas (SQLAlchemy `Mapped`/`mapped_column`).
- **`api/services/database_manager.py`** — ponto único de acesso ao banco:
  - engine primário PostgreSQL (variáveis `DB_USUARIO`, `DB_SENHA`, `DB_HOST`, `DB_PORT`, `DB_SCHEM`);
  - cliente Supabase REST (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`);
  - `get_session()` com **failover**: se o Postgres local não responder, troca para o Supabase (classe `SupabaseSession` que imita a API do `Session`);
  - thread de health check (a cada 10s, com cooldown de 15s) que **volta automaticamente** ao primário quando ele volta;
  - contadores de failover/recuperação expostos em `/diagnosticos/status_banco`.

O `main.py` registra **19 routers** com prefixes por domínio (ex.: `/materias-primas`, `/estoque`, `/ordens-producao`, `/graficos`) e monta o diretório estático `/web`. No `lifespan`, ele (re)cria as views com `CREATE OR REPLACE VIEW` — falha de banco no boot é só logada, não derruba a API.

Prefixes registrados: `/diagnosticos`, `/auth`, `/usuarios`, `/fornecedores`, `/materias-primas`, `/lotes`, `/estoque`, `/compras`, `/formulas`, `/clientes`, `/pedidos`, `/ordens-producao`, `/consumos`, `/previsoes`, `/sugestoes-compra`, `/alertas`, `/dashboard`, `/relatorios`, `/graficos`.

---

## Módulos e Funcionalidades

### Cadastros (CRUD)
- **Usuários** — CRUD protegido: apenas usuários **admin** podem criar/editar/deletar (403 `Somente Administradores…`). Senhas gravadas com hash (`pwdlib`).
- **Fornecedores** — razão social, CNPJ, contato, prazo de entrega, ativo/inativo; filtros por nome e status.
- **Matérias-Primas** — código, nome, unidade, estoque mínimo/máximo, consumo médio mensal; consultas por nome, "estoque baixo" e "vencendo".
- **Lotes** — vínculo com matéria-prima e fornecedor, número do lote, quantidades, datas de fabricação/validade/recebimento, valor unitário; filtros por vencimento, matéria-prima e fornecedor.
- **Clientes** — nome, telefone e e-mail.
- **Fórmulas** — cadastro de fórmulas magistrais com seus itens (matéria-prima + quantidade).

### Operações
- **Estoque** — saldo por matéria-prima (soma dos lotes), saldo por lote, registro de movimentações (ENTRADA/SAIDA) com validação de saldo e histórico. Rota estática `/estoque/movimentacoes` declarada antes de `/{materia_prima_id}` (senão o FastAPI casa a rota dinâmica e retorna 422).
- **Compras** — pedidos de compra por fornecedor com itens; ações de **receber** (gera lotes automaticamente com nº `COMPRA-{id}-{item}`, registra entrada no estoque e movimentação) e **cancelar**.
- **Pedidos** — pedidos de clientes (venda) com itens de fórmulas.
- **Produção** — ordens de produção vinculadas a pedidos, com ciclo de vida **PENDENTE → EM_PRODUCAO → FINALIZADA** (ou CANCELADA) e registro de consumo de lotes (baixa automática no estoque + movimentação de saída).

### Análise e Inteligência
- **Consumo** — histórico de consumo com filtro por período e matéria-prima.
- **Previsões** — duas formas de gerar:
  - `POST /previsoes/gerar` — previsão **informada manualmente** (default `modelo_utilizado="MEDIA_MOVEL"`);
  - `POST /previsoes/gerar-automatica` — calcula a **média móvel dos últimos 6 meses** por `vw_consumo_mensal` e grava a previsão do período corrente (confiança 90). Continua sendo estatística simples, **não há modelo de ML treinado**.
- **Sugestões de Compra** — geração automática: para cada matéria-prima ativa cujo estoque somado dos lotes está abaixo do mínimo, cria sugestão com a quantidade para atingir o máximo; fluxo de **aprovar/rejeitar**.
- **Alertas** — alertas com tipo, prioridade, descrição e status resolvido; filtros por tipo/prioridade/resolvido e ação de resolver.
- **Gráficos** — `GET /graficos/consumo` gera um PNG (pandas + matplotlib, tema escuro/transparente) e devolve como `StreamingResponse`. Uso experimental — a SPA consome os dados via API e desenha com **ApexCharts**.

### Dashboard e Relatórios
- **Dashboard** — resumo geral (total de matérias-primas, compras pendentes, ordens em produção, alertas ativos) + visões de estoque, compras, produção, previsões e alertas (`/dashboard/estoque|compras|producao|previsoes|alertas`).
- **Relatórios** — consumo (com filtro de datas), estoque atual, vencimentos, compras, produção e previsões.
- **Diagnósticos** — `/diagnosticos/informacao_servidor` (SO/plataforma, usado pela tela de login) e `/diagnosticos/status_banco` (banco ativo, disponibilidade do primário, total de failovers/recuperações).

---

## Banco de Dados (PostgreSQL)

**Instalação recomendada:** executar `setup_completo.sql` (raiz do repositório) em um banco vazio ou existente — ele junta, na ordem certa, limpeza → tabelas → views → trigger → índices → seed.

Alternativamente, os scripts individuais seguem em `src/sql/` (24 arquivos: DDL por tabela, `views.sql`, `indices.sql`, `consumo_medio_trigger.sql`, `dashboard.sql` e consultas analíticas), executados manualmente.

Principais tabelas (18 entidades no ORM):

- `usuarios`, `fornecedores`, `materias_primas`, `clientes`, `formulas`, `formula_itens`
- `lotes`, `movimentacoes_estoque`
- `compras`, `compra_itens`
- `pedidos`, `pedido_itens`
- `ordens_producao`, `consumo_producao`
- `historico_consumo`, `previsoes_consumo`, `sugestoes_compra`, `alertas`
- demais de apoio: `sazonalidade`

Views prontas: `vw_estoque_atual`, `vw_consumo_mensal`, `vw_vencimentos` — declaradas em `src/sql/views.sql` e **(re)criadas na subida da API** (`api/services/views.py`), o que garante que nenhum ambiente fique sem elas.

Trigger `atualizar_consumo_medio()` (`src/sql/consumo_medio_trigger.sql`) mantém `materias_primas.consumo_medio_mensal` atualizado a cada INSERT/UPDATE/DELETE em `historico_consumo`.

Índices criados para consultas frequentes: validade e matéria-prima de lotes, datas de consumo/movimentação/previsão/pedido e status de ordens.

`docker/init.sql` **não cria schema** — contém apenas o seed de demonstração (mesmo conteúdo de `testes/seed_dados_teste.sql` e `src/api/services/dependencies/seed_demo.sql`).

---

## Autenticação e Segurança

- Login via `POST /auth/login` validando email + senha contra hash no banco.
- O hash usa `pwdlib.PasswordHash.recommended()` (Argon2/Bcrypt).
- Após login, é gerado um **token de sessão aleatório (UUID)** mantido em um **dicionário em memória** (`tokens_dict`), enviado como `Authorization: Bearer <token>`.
- Endpoints de sessão: `POST /auth/logout` (remove o token), `POST /auth/refresh` (gera um novo token para a sessão) e `GET /auth/me` (dados do usuário autenticado).
- Endpoints de usuário (criar/editar/deletar) verificam se o token pertence a um usuário **admin**.
- A doc menciona JWT (`python-jose` está nas dependências), mas **a implementação usa tokens em memória** — perdem-se ao reiniciar o servidor.
- **Login de demonstração:** quando o usuário demo (id fixo `5`) faz login, o banco é resetado com o seed (`dependencies/seed_demo.sql`) automaticamente.
- `src/.env` não é versionado (`.gitignore` de `src/`); existem `.env.example` na raiz e em `src/`.

---

## Fluxo Principal da Aplicação

```
Cliente
   │
   ▼
Pedido
   │
   ▼
Ordem de Produção
   │
   ▼
Consumo de Matérias-Primas (baixa em lote)
   │
   ▼
Movimentação de Estoque
   │
   ▼
Histórico de Consumo (+ trigger de consumo médio)
   │
   ▼
Previsão de Consumo (manual ou média móvel) → Sugestões de Compra → Alertas
```

Conceito de gestão por lotes permite a aplicação do **FEFO** (primeiro a vencer, primeiro a sair) — previsto na documentação e viabilizado pelos campos de validade dos lotes.

---

## Frontend (Web)

### Organização
O JS foi modularizado em três pastas, carregadas pelo `loader.js`:

- `js/api/` — `client.js` (wrapper `API.get/post/put/del`, envio do `Authorization: Bearer`, toast de erro em falhas de GET) e módulos por domínio (`dashboard.js`, `cadastros.js`, `operacoes.js`, `analise.js`).
- `js/core/` — `charts.js` (helpers ApexCharts: linha, barra, donut, paleta por tema, destruição/recriação ao trocar tema), `ui.js` (modais, formulários, tabelas com "Ver mais", badges de status), `inactivity.js`.
- `js/pages/` — 17 páginas (`renderDashboard`, `renderUsuarios`, … `renderConfiguracoes`), mapeadas em `app.js` (`PAGE_TITLES` / `PAGE_RENDERERS`).

### Telas e comportamentos
- **Login** (`/web/login`) — logo, mostra o SO/servidor obtido de `/diagnosticos/informacao_servidor`, botão de mostrar/ocultar senha, **Enter no campo de email/senha dispara o login**, guarda o token no `localStorage` e redireciona para o app. Há um modal de "alteração de senha" no HTML **sem handler implementado**.
- **App** (`/web/app.html`) — SPA com sidebar (Dashboard, Cadastros, Operações, Análise, Relatórios, Configurações, Sair); header com saudação, atalho de Configurações e botão de tema.
- **Tema e preferências** (`tema.js`, `window.Preferencias`, chave `axionphare-config`) — aplicado sincronamente no `<head>` (sem "pisca" de tema). Preferências: tema **escuro/claro/sistema**, tamanho da fonte, animações, tabelas compactas, página inicial, itens por lista (10–100) e tempo de inatividade; salvas no `localStorage` e com evento `preferencias-alteradas`.
- **Página de Configurações** — cartões de Aparência, Navegação, Sessão e Conta (dados do usuário logado), com "Restaurar padrões".
- **Listas** — padrão "Ver mais/Ver menos" com limite configurável; `resetListas()` a cada troca de tela.
- **Loader com cache** (`loader.js`) — splash com barra de progresso; baixa e armazena todos os 26 scripts da SPA em Cache API + `localStorage` (versão do cache `axionphare-assets-v13`, com limpeza das versões antigas e referências com `?v=`), permitindo carregamento offline/instantâneo.
- **Controle de inatividade** (`inactivity.js`) — aviso antes do logout e desligamento automático; o tempo é configurável em Configurações → Sessão (padrão 1 min, avisando 30s antes).
- Página de **usuários** fica oculta para usuários não-admin.
- Ícones/fontes e bibliotecas via CDN (Bootstrap 5.3.8, Bootstrap Icons 1.13.1, ApexCharts); tema escuro por padrão (`data-bs-theme`).

---

## Subprojetos no Repositório

| Pasta | O que é | Stack |
|-------|---------|-------|
| `site-axionphare/` | Site institucional/landing page do produto (hero, diferenciais, como funciona, próximos passos, footer) | React 19 + Vite 8 + Sass, ESLint, React Compiler |
| `slides_bg/` | Slides de apresentação com painéis ao vivo; `server/index.js` (Express) expõe `/api/system` (hardware via **SSH**: CPU, RAM, disco, carga), `/api/database` (contagens via `pg`) e `/api/supabase` (health do REST + contadores de failover) | React 19 + Vite 6 + Express + `pg` + `ssh2` |
| `cartoes/` | Arte do cartão promocional (PNG/PSD) | — |

O slides tem template de variáveis versionado em `slides_bg/.env.template` (Postgres + SSH + `SUPABASE_URL`/`SUPABASE_SECRET_KEY`/`APP_API_URL`); `node_modules/` e `dist/` dos subprojetos não são versionados.

---

## Deploy / Docker

`docker-compose.yml` sobe dois serviços e é **100% parametrizado por `.env`** (existe `.env.example` na raiz):

1. **db** — imagem `postgres:${POSTGRES_VERSION:-16}-alpine`, usuário/senha/banco vindos do `.env`, volume persistente `pgdata` e healthcheck (`pg_isready`); roda `docker/init.sql` na inicialização (seed).
2. **app** — imagem construída pelo `Dockerfile` (base `python:3.x-slim` + binário do **uv**; `uv sync --frozen --no-dev` a partir de `src/pyproject.toml`/`src/uv.lock`); porta `${APP_PORT:-80}`, depende do banco saudável e roda `uvicorn ${APP_MODULE:-main:app}`.

Variáveis usadas: `DB_USUARIO`, `DB_SENHA`, `DB_SCHEM`, `DB_HOST`, `DB_PORT`, `POSTGRES_VERSION`, `SEGREDO`, `APP_PORT`, `APP_HOST`, `APP_MODULE`, `PYTHON_VERSION`, `UV_VERSION`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

> Observação: `SEGREDO` é injetado no container mas **não é lido por nenhum código Python** hoje (sobra de uma intenção de JWT). O Supabase é opcional: sem `SUPABASE_URL`/`SUPABASE_SECRET_KEY` o app avisa em log e fica apenas com o primário.

---

## Observações e Pontos de Atenção

- **"IA" simplificada:** a previsão automática usa média móvel de 6 meses sobre `vw_consumo_mensal` (sem modelo treinado) e as sugestões de compra usam regra simples (estoque < mínimo → sugerir até o máximo).
- **Tokens em memória:** sessões não sobrevivem a restart do backend; em produção seria recomendado JWT/Redis.
- **Failover Supabase:** implementado e instrumentado, porém `SupabaseSession` traduz um subconjunto de SQL/SQLAlchemy para o REST do Supabase — consultas muito complexas podem não ser suportadas no modo fallback.
- **Documentação** (`src/docs/api_endpoints.md`) está desatualizada em relação ao código: não cita `/graficos/*`, `/previsoes/gerar-automatica` e `/diagnosticos/status_banco`, descreve `/auth/refresh` como JWT (na prática é um novo token em memória) e ainda lista endpoints "recomendados" que não existem (ex.: `/dashboard/kpis`, `/ia/*`, FEFO automático na produção).
- **Segredos:** `.env` não deve ser versionado (`.gitignore` de `src/` já exclui); use `.env.example` como referência.
- A senha padrão na criação de usuários (`database_usuarios.criar_usuario`) é `"SenhaPadrao"`.
- `/graficos/consumo` (PNG via matplotlib) não é consumido pela SPA — os gráficos da interface usam ApexCharts.
- Modal de alteração de senha na tela de login existe no HTML, mas **não tem JavaScript/endpoint associado**.
- Scripts duplicados de seed (`testes/seed_dados_teste.sql`, `docker/init.sql`, `src/api/services/dependencies/seed_demo.sql`) têm o mesmo conteúdo — alterações precisam ser replicadas nos três.
