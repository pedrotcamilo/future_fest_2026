# AGENTS.md — AxionPhare (`future_fest_2026`, branch `dev`)

Sistema de gestão de estoque para farmácia de manipulação. Monolito FastAPI que serve API REST + SPA estática. Trabalho acadêmico FIAP 2026.

## Onde está o quê

- `src/main.py` — entrada do backend. Registra 19 routers e monta `StaticFiles(directory="web")` em `/web`. `lifespan` recria views via `api/services/views.py` (falha de banco no boot é só log, não derruba a API).
- `src/api/routes/` (19 arquivos) → `src/api/services/database_*.py` → `src/api/services/models.py` (18 entidades ORM). Padrão obrigatório: **Router → Service → ORM**. Routes só validam payload (Pydantic) e chamam services; SQL/ORM só nos services.
- `src/api/services/database_manager.py` — único acesso ao banco. `get_session()` com failover Postgres local → Supabase REST (`SupabaseSession` imita `Session`). Health check a cada 10s volta ao primário sozinho. Status em `GET /diagnosticos/status_banco`.
- `src/sql/` (24 scripts: DDL por tabela, `views.sql`, `indices.sql`, `consumo_medio_trigger.sql`) e `setup_completo.sql` (raiz — script ÚNICO de instalação: limpeza → tabelas → views → trigger → índices → seed). **Instalação recomendada: rodar `setup_completo.sql` num banco vazio.**
- `src/web/` — frontend: `login/` + `app.html` + `app/js/{api,core,pages}` (17 páginas em `pages/`, chamadas HTTP em `api/client.js` + módulos por domínio, `core/{charts,ui,inactivity}.js`). `tema.js` + `loader.js` (cache `axionphare-assets-v13` em Cache API + localStorage).
- `src/docs/api_endpoints.md` — **desatualizada** (falta `/graficos/*`, `/previsoes/gerar-automatica`, `/diagnosticos/status_banco`; descreve JWT que não existe). Confie no código, não nela.
- Subprojetos isolados (não mexer junto com o backend): `site-axionphare/` (React 19 + Vite 8 + Sass), `slides_bg/` (React 19 + Vite 6 + Express `server/index.js` com SSH/`pg`), `cartoes/`, `app-desktop/`. `testes/` tem `limpar_banco.sql` + `seed_dados_teste.sql`.

## Como rodar

```bash
# Backend local (a partir de src/ — o StaticFiles espera cwd=src/)
cd src && uv sync --frozen && uv run uvicorn main:app --reload
# ou: pip install -r requirements.txt && uvicorn main:app --reload

# Docker (raiz do repo, 100% parametrizado por .env — ver .env.example)
docker compose up --build
```

- Python: `src/pyproject.toml` exige `>=3.14`, mas Dockerfile/compose usam 3.12 por padrão — ambos funcionam, não "corrija" a divergência sem pedir.
- Banco: Postgres 16 (`DB_USUARIO`, `DB_SENHA`, `DB_HOST`, `DB_PORT`, `DB_SCHEM`). Supabase (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`) é opcional. Nunca versione `.env` (há `.env.example` na raiz e em `src/`).
- API em `http://localhost:<APP_PORT>` (padrão 80 no compose, 8000 no uvicorn), SPA em `/web`, docs em `/docs`.

## Convenções de código

- Backend: um arquivo de rota por domínio (`api/routes/<dominio>.py`) + um `database_<dominio>.py` correspondente. Novos endpoints seguem o prefixo existente (ex. `/materias-primas`, `/ordens-producao`, `/sugestoes-compra`). **Ordem das rotas importa**: rotas estáticas (ex. `/estoque/movimentacoes`) sempre antes de `/{id}` ou o FastAPI retorna 422.
- Auth: `POST /auth/login` (email+senha, hash `pwdlib`), token UUID em memória (`tokens_dict`) via `Authorization: Bearer`. Sem JWT, sem persistência (restart invalida tudo). CRUD de usuários exige admin (403). Senha padrão ao criar usuário: `"SenhaPadrao"`. Login do usuário demo (id `5`) **reseta o banco com o seed** — nunca teste como demo em banco com dados reais.
- Frontend: sem framework, JS puro + Bootstrap 5 + ApexCharts via CDN. Páginas registram em `PAGE_TITLES`/`PAGE_RENDERERS` (`app.js`); novas chamadas HTTP vão em `js/api/` por domínio; gráficos usam `core/charts.js` (respeita tema escuro/claro via `data-bs-theme`, preferências `axionphare-config` no localStorage).
- Gráfico backend `GET /graficos/consumo` (pandas+matplotlib PNG) é experimental — a SPA usa ApexCharts, não esse endpoint.
- IA/previsão (`ai_request.py`, `prompts/`, `GEMINI_*`/`GROQ_*`/`AI_*` no `src/.env.example`): previsão automática = média móvel 6 meses sobre `vw_consumo_mensal` (confiança 90 fixa), sugestão de compra = regra simples (estoque < mínimo → completar até máximo). Não há ML treinado; não prometa o contrário.

## Armadilhas (não quebrar)

1. Views `vw_estoque_atual`, `vw_consumo_mensal`, `vw_vencimentos` são recriadas no boot — mude em `src/sql/views.sql` **e** `api/services/views.py`.
2. Seed triplicado com mesmo conteúdo: `docker/init.sql` (só seed, sem schema) = `testes/seed_dados_teste.sql` = `src/api/services/dependencies/seed_demo.sql`. Alteração de seed replica nos três.
3. `SEGREDO` no compose não é lido por nenhum código Python — não remover nem "ligar" sem pedir.
4. Status de produção é máquina de estados `PENDENTE → EM_PRODUCAO → FINALIZADA` (ou `CANCELADA`); receber compra gera lotes `COMPRA-{id}-{item}` + entrada + movimentação; consumo dá baixa + saída automaticamente.
5. Sem testes automatizados (só SQL em `testes/`). Sem linter configurado no backend. Valide com `uvicorn` subindo + `GET /diagnosticos/status_banco` e, se mexer em SQL, rode `setup_completo.sql` num banco de teste.
