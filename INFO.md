# AxionPhare — Sistema de Gestão de Estoque para Farmácia de Manipulação

## Visão Geral

O **AxionPhare** é um sistema de gestão de estoque voltado para **farmácias de manipulação de pequeno porte**. Ele cobre todo o ciclo operacional de uma farmácia magistral: cadastro de matérias-primas, controle de lotes por validade, compras de fornecedores, fórmulas magistrais, pedidos de clientes, ordens de produção, consumo de insumos, movimentações de estoque e geração de previsões e sugestões de compra.

A aplicação é um **monolito com SPA (Single Page Application)**: o backend em Python (FastAPI) serve tanto a API REST quanto os arquivos estáticos do frontend (HTML/CSS/JS), consumidos por uma interface web responsiva com tema escuro baseada em Bootstrap 5.

O projeto é um trabalho acadêmico do **FIAP 2026** (nome do repositório: `future_fest_2026`).

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Backend | Python 3.14, FastAPI, Uvicorn |
| ORM / Banco | SQLAlchemy 2.0, PostgreSQL |
| Autenticação | `pwdlib` (Argon2/Bcrypt) para senhas; tokens de sessão em memória |
| Frontend | HTML, CSS, JavaScript puro, Bootstrap 5 (CDN), Bootstrap Icons |
| Infraestrutura | Docker + Docker Compose (PostgreSQL + aplicação) |
| Gerenciamento de deps | `uv` (arquivos `pyproject.toml` e `uv.lock`) |

---

## Estrutura do Repositório

```
future_fest_2026/
├── docker-compose.yml       # Orquestra PostgreSQL + app
├── Dockerfile               # Build da imagem da aplicação
├── docker/init.sql          # Schema completo do banco (tabelas, views, índices)
├── cartoes/                 # Arte do cartão (PNG/PSD)
├── testes/
│   ├── limpar_banco.sql     # Trunca tabelas (exceto usuarios)
│   └── seed_dados_teste.sql # Dados fictícios para demonstração
└── src/
    ├── main.py              # Entrada do FastAPI, registra rotas e serve /web
    ├── api/
    │   ├── routes/          # 18 arquivos de rotas REST
    │   └── services/        # Camada de acesso a dados (SQLAlchemy)
    ├── sql/                 # Scripts SQL avulsos (schema e consultas analíticas)
    ├── docs/api_endpoints.md# Documentação dos endpoints
    └── web/                 # Frontend (login + app)
```

---

## Arquitetura

A arquitetura segue o padrão **Router → Service → ORM**:

- **`api/routes/*.py`** — definem os endpoints HTTP (FastAPI `APIRouter`), recebem/validam payloads (Pydantic) e retornam respostas.
- **`api/services/*.py`** — camada de banco: funções que abrem sessão SQLAlchemy, executam consultas e retornam dados já serializados (dicionários/strings).
- **`api/services/models.py`** — mapeamento ORM das tabelas (SQLAlchemy `Mapped`/`mapped_column`).
- **`api/services/database.py`** — cria o `engine` a partir de variáveis de ambiente (`DB_USUARIO`, `DB_SENHA`, `DB_HOST`, `DB_PORT`, `DB_SCHEM`).

O `main.py` monta a aplicação registrando 18 routers com prefixes por domínio (ex.: `/materias-primas`, `/estoque`, `/ordens-producao`) e monta o diretório estático `/web`.

---

## Módulos e Funcionalidades

### Cadastros (CRUD)
- **Usuários** — CRUD protegido: apenas usuários **admin** podem criar/editar/deletar. Senhas gravadas com hash (`pwdlib`).
- **Fornecedores** — razão social, CNPJ, contato, prazo de entrega, ativo/inativo; filtros por nome e status.
- **Matérias-Primas** — código, nome, unidade, estoque mínimo/máximo, consumo médio mensal; consultas por nome, "estoque baixo" e "vencendo".
- **Lotes** — vínculo com matéria-prima e fornecedor, número do lote, quantidades, datas de fabricação/validade/recebimento, valor unitário; filtros por vencimento, matéria-prima e fornecedor.
- **Clientes** — nome, telefone e e-mail.
- **Fórmulas** — cadastro de fórmulas magistrais com seus itens (matéria-prima + quantidade).

### Operações
- **Estoque** — saldo por matéria-prima (soma dos lotes), saldo por lote, registro de movimentações (ENTRADA/SAIDA) com validação de saldo e histórico de movimentações.
- **Compras** — pedidos de compra por fornecedor com itens; ações de **receber** (gera lotes automaticamente, registra entrada no estoque e movimentação) e **cancelar**.
- **Pedidos** — pedidos de clientes (venda) com itens de fórmulas.
- **Produção** — ordens de produção vinculadas a pedidos, com ciclo de vida **PENDENTE → EM_PRODUCAO → FINALIZADA** (ou CANCELADA) e registro de consumo de lotes (baixa automática no estoque + movimentação de saída).

### Análise e Inteligência
- **Consumo** — histórico de consumo com filtro por período e matéria-prima.
- **Previsões** — registro de previsões de consumo por matéria-prima (período, consumo previsto, confiança e "modelo utilizado"). **Atenção:** apesar da doc mencionar IA/ML, a implementação atual é simples: a previsão é **informada manualmente** via `POST /previsoes/gerar` (default `modelo_utilizado="MEDIA_MOVEL"`), sem modelo treinado.
- **Sugestões de Compra** — geração automática: para cada matéria-prima ativa cujo estoque somado dos lotes está abaixo do mínimo, cria sugestão com a quantidade para atingir o máximo; fluxo de **aprovar/rejeitar**.
- **Alertas** — alertas com tipo, prioridade, descrição e status resolvido; filtros por tipo/prioridade/resolvido e ação de resolver.

### Dashboard e Relatórios
- **Dashboard** — resumo geral (total de matérias-primas, compras pendentes, ordens em produção, alertas ativos) + visões de estoque, compras, produção, previsões e alertas.
- **Relatórios** — consumo (com filtro de datas), estoque atual, vencimentos, compras, produção e previsões.

---

## Banco de Dados (PostgreSQL)

O schema é criado pelo `docker/init.sql` (executado no primeiro boot do container). Principais tabelas:

- `usuarios`, `fornecedores`, `materias_primas`, `clientes`, `formulas`, `formula_itens`
- `lotes`, `movimentacoes_estoque`
- `compras`, `compra_itens`
- `pedidos`, `pedido_itens`
- `ordens_producao`, `consumo_producao`
- `historico_consumo`, `previsoes_consumo`, `sugestoes_compra`, `sazonalidade`, `alertas`

Views prontas: `vw_estoque_atual`, `vw_consumo_mensal`, `vw_vencimentos`.

Índices criados para consultas frequentes: validade e matéria-prima de lotes, datas de consumo/movimentação/previsão/pedido e status de ordens.

Há também scripts SQL avulsos em `src/sql/` (schema e consultas analíticas) que funcionam como referência/backup do schema.

---

## Autenticação e Segurança

- Login via `POST /auth/login` validando email + senha contra hash no banco.
- O hash usa `pwdlib.PasswordHash.recommended()` (Argon2/Bcrypt).
- Após login, é gerado um **token de sessão aleatório (UUID)** mantido em um **dicionário em memória** (`tokens_dict`), enviado como `Authorization: Bearer <token>`.
- Endpoints de usuário (criar/editar/deletar) verificam se o token pertence a um usuário **admin**.
- A doc menciona JWT, mas a implementação atual usa tokens em memória (perdem-se ao reiniciar o servidor).
- **Login de demonstração:** quando o usuário demo (id fixo `5`) faz login, o banco é resetado com o seed (`seed_dados_teste.sql`) automaticamente.

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
Histórico de Consumo
   │
   ▼
Previsão de Consumo → Sugestões de Compra → Alertas de falta/vencimento
```

Conceito de gestão por lotes permite a aplicação do **FEFO** (primeiro a vencer, primeiro a sair) — previsto na documentação e viabilizado pelos campos de validade dos lotes.

---

## Frontend (Web)

- **Login** (`/web/login`) — tela com logo, mostra informação do servidor obtida de `/diagnosticos/informacao_servidor`; guarda o token no `localStorage` e redireciona para o app.
- **App** (`/web/app.html`) — SPA com sidebar (Dashboard, Cadastros, Operações, Análise, Relatórios, Sair) e renderização por página via `app.js` (mapeamento página → função `render*`).
- **Loader com cache** (`loader.js`) — splash de carregamento com barra de progresso; baixa e armazena todos os scripts JS em Cache API + `localStorage`, permitindo carregamento offline/instantâneo.
- **Controle de inatividade** (`inactivity.js`) — avisa após 30s e desloga automaticamente após 1 minuto sem atividade.
- Página de **usuários** fica oculta para usuários não-admin.
- Ícones/fontes vindos de CDN (Bootstrap 5.3.8 e Bootstrap Icons); tema escuro por padrão (`data-bs-theme="dark"`).

---

## Deploy / Docker

`docker-compose.yml` sobe dois serviços:

1. **db** — imagem `postgres:latest`, usuário/senha `axionphare`, volume persistente `pgdata` e healthcheck; roda `docker/init.sql` na inicialização.
2. **app** — imagem construída pelo `Dockerfile` (Python 3.14-slim, instala dependências via `pip install .` e roda `uvicorn main:app --host 0.0.0.0 --port 8000`); depende do banco saudável.

Variáveis de ambiente usadas pela aplicação: `DB_USUARIO`, `DB_SENHA`, `DB_HOST`, `DB_PORT`, `DB_SCHEM` e `SEGREDO` (segredo definido no compose; note que o valor no compose está como placeholder `(SEGREDO AQUI)`).

---

## Observações e Pontos de Atenção

- **"IA" simplificada:** as previsões de consumo são registradas manualmente (não há modelo de ML treinado em runtime), e as sugestões de compra usam regra de negócio simples (estoque < mínimo → sugerir até o máximo).
- **Tokens em memória:** sessões não sobrevivem a restart do backend; em produção seria recomendado JWT/Redis.
- **Documentação** (`src/docs/api_endpoints.md`) lista endpoints "recomendados" que nem todos estão implementados (ex.: `/dashboard/kpis`, `/ia/*`, FEFO automático na produção).
- **Segredos:** `.env` e `SEGREDO` não devem ser versionados (`.gitignore` já exclui `.env`).
- A senha padrão na criação de usuários (`database_usuarios.criar_usuario`) é `"SenhaPadrao"`.
- Projeto modularizado recentemente (commits de "Modularizado + Tela de Carregamento"), com arquivo de requisitos e seed de dados fictícios para demonstração.