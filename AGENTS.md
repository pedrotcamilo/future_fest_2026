# Relatório de Integração — API AxionPhare

> **Objetivo deste documento:** permitir que outra IA (ou pessoa) implemente um aplicativo cliente
> (web, desktop ou mobile) que converse corretamente com a API deste projeto, sem precisar ler o
> código-fonte.
>
> **Fonte da verdade:** código em `src/api/routes/` + `src/api/services/`, OpenAPI gerado em runtime
> (`/openapi.json`) e respostas reais capturadas de uma instância em execução.
>
> **Data da análise:** 29/10/2026 · **Branch:** `dev` · **Versão da API:** não versionada.

---

## 0. Resumo executivo (leia antes de codar)

| Item | Valor |
|---|---|
| Tipo | Monolito FastAPI que serve API REST + SPA estática |
| Base URL | `http://<host>:<porta>` (sem prefixo `/api`) |
| Porta padrão | `8000` com `uvicorn`; `80` no Docker Compose (`APP_PORT`) |
| Formato | JSON na maioria; **texto puro** em várias mutações; **PNG** em `/graficos/consumo` |
| Autenticação | `POST /auth/login` → token UUID em memória → `Authorization: Bearer <token>` |
| Proteção real | **Somente** `POST/PUT/DELETE /usuarios/*` exigem admin. Todo o resto é público. |
| Documentação interativa | `/docs` (Swagger UI) e `/openapi.json` |
| Paginação | **Não existe** — listas retornam tudo |
| CORS | **Não configurado** — app web em outra origem será bloqueado pelo navegador |
| Sessão | Token em dicionário na memória; reiniciar o servidor invalida todos |
| Banco | PostgreSQL 16 com fallback automático para Supabase REST |
| “IA” | Média móvel de 6 meses + regra de estoque; não há ML treinado |

**Regra de ouro para o cliente:** sempre trate a resposta pelo `Content-Type`; nunca assuma que
toda resposta 200 é JSON.

---

## 1. Como executar e acessar

### 1.1 Subir localmente

```bash
# a partir de src/ (o StaticFiles espera cwd=src/)
uv sync --frozen
uv run uvicorn main:app --reload
# API:    http://localhost:8000
# SPA:    http://localhost:8000/web
# Swagger:http://localhost:8000/docs
# OpenAPI:http://localhost:8000/openapi.json
```

### 1.2 Docker

```bash
docker compose up --build
# porta definida em APP_PORT (padrão 80)
```

### 1.3 Variáveis de ambiente relevantes

| Variável | Uso |
|---|---|
| `DB_USUARIO`, `DB_SENHA`, `DB_HOST`, `DB_PORT`, `DB_SCHEM` | PostgreSQL primário |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Fallback REST (opcional) |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | Endpoint de predição por IA |
| `APP_PORT` | Porta no Docker |

> O arquivo `.env` contém segredos reais e **não deve ser versionado nem embutido no app cliente**.

### 1.4 Prefixos registrados

`/diagnosticos`, `/auth`, `/usuarios`, `/fornecedores`, `/materias-primas`, `/lotes`, `/estoque`,
`/compras`, `/formulas`, `/clientes`, `/pedidos`, `/ordens-producao`, `/consumos`, `/previsoes`,
`/sugestoes-compra`, `/alertas`, `/dashboard`, `/relatorios`, `/graficos`.

São **63 operações** no total (ver catálogo na seção 5).

---

## 2. Convenções HTTP

### 2.1 Barra final (trailing slash) — muito importante

As rotas de coleção foram declaradas como `"/"`, então o caminho real termina em `/`:

```
GET  /fornecedores        → 307 Temporary Redirect → /fornecedores/
GET  /fornecedores/       → 200
POST /fornecedores        → 307 (curl NÃO segue por padrão; fetch/browser seguem)
POST /fornecedores/       → 200
```

**Recomendação:** use sempre a barra final em rotas de coleção:
`/fornecedores/`, `/clientes/`, `/compras/`, `/pedidos/`, `/formulas/`, `/lotes/`,
`/materias-primas/`, `/ordens-producao/`, `/previsoes/`, `/sugestoes-compra/`, `/alertas/`,
`/usuarios/`, `/dashboard/`, `/estoque/`, `/consumos/`, `/relatorios/...` (estas não têm barra).

Rotas com ID e ações **não** levam barra final: `/fornecedores/1`, `/compras/1/receber`.

### 2.2 Formato de resposta

| Situação | `Content-Type` | Corpo |
|---|---|---|
| Listas e objetos | `application/json` | JSON |
| Mutações simples | `text/plain; charset=utf-8` | `Ok` |
| Erros de ação | `application/json` | `{"erro": "mensagem"}` |
| Erros de validação | `application/json` | `{"detail": [...]}` (padrão FastAPI) |
| Erros de permissão | `text/plain` | `Somente Administradores podem executar esta acao!` |
| Não encontrado | `text/plain` (sem media type explícito) | `Registro nao encontrado!` |
| Gráfico | `image/png` | binário PNG |
| Diagnóstico de servidor | `text/plain` | texto multilinha |

### 2.3 Códigos de status usados

| Código | Quando |
|---|---|
| `200` | Sucesso (inclusive mutações e até falha da IA — ver §8) |
| `307` | Falta de barra final em rota de coleção |
| `400` | Regra de negócio violada (`{"erro": ...}`) ou campos pendentes (`Campos pendentes!`) |
| `401` | Login inválido, token ausente/inválido em `/auth/*` |
| `403` | Usuário não-admin em mutação de `/usuarios/*` |
| `404` | Registro não encontrado (texto) ou rota inexistente |
| `405` | Método não permitido |
| `422` | Payload/query inválido (Pydantic) |
| `500` | Erro de banco não tratado (ex.: FK inexistente, `NOT NULL` violado) |

### 2.4 Erro de validação (422)

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "razao_social"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

### 2.5 Sem CORS

`main.py` **não** registra `CORSMiddleware`. Consequências:

- SPA servida pelo próprio backend (`/web`) funciona.
- App desktop (Electron/Tauri) ou mobile **não é afetado** por CORS.
- App web em outro domínio/porta será bloqueado pelo navegador.
  Para esse caso, será necessário adicionar CORS no backend ou usar um proxy reverso.

### 2.6 Sem paginação, sem ordenação garantida

Todas as listas retornam o conjunto completo. A ordenação só é explícita em:

- `/alertas/` → `data_alerta DESC`
- `/previsoes/` → `data_previsao DESC`
- `/sugestoes-compra/` → `data_sugestao DESC`
- `/estoque/movimentacoes` → `data_movimento DESC`
- `/consumos/` → `data DESC`
- `/relatorios/*` → conforme a regra de cada um

Nas demais, não confie na ordem. Pagine/filtre no cliente.

---

## 3. Autenticação e sessão

### 3.1 Como funciona (implementação real)

1. `POST /auth/login` com `{ "email": "...", "senha": "..." }`.
2. O backend busca o usuário por e-mail e verifica o hash com `pwdlib` (Argon2/Bcrypt).
3. Se válido, gera um **UUID v4** e guarda em um dicionário em memória: `{ email: token }`.
4. O cliente envia `Authorization: Bearer <token>` nas requisições.
5. **Não há JWT, não há expiração, não há persistência.** Reiniciar a API derruba todas as sessões.
6. **Um token por e-mail:** novo login (ou refresh) sobrescreve o token anterior.

### 3.2 Endpoints de sessão

#### `POST /auth/login`

```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@localhost", "senha": "********" }
```

Sucesso — `200`:

```json
{ "status": "Autenticado", "token": "3f2b8c1e-9a4d-4f7b-8c2e-1d5a6b7c8d9e" }
```

Falha — `401`:

```json
{ "status": "Nao autorizado", "token": null }
```

> `email` é `str` simples (não valida formato). A busca é por igualdade exata (case-sensitive).
> Se houver e-mails duplicados, o primeiro encontrado é usado.

#### `POST /auth/logout`

```http
POST /auth/logout
Authorization: Bearer <token>
```

Sempre `200`, mesmo sem token:

```json
{ "status": "Sessao encerrada" }
```

#### `POST /auth/refresh`

```http
POST /auth/refresh
Authorization: Bearer <token>
```

Sucesso `200`: `{ "token": "<novo-uuid>" }` (o token antigo deixa de valer).
Sem header `401`: `{ "status": "Token nao informado" }`.
Token desconhecido `401`: `{ "status": "Token invalido" }`.

#### `GET /auth/me`

```http
GET /auth/me
Authorization: Bearer <token>
```

`200`:

```json
{
  "id": 1,
  "nome": "Administrador",
  "telefone": "-",
  "email": "admin@localhost",
  "admin": true
}
```

`401`: `{ "status": "Nao autorizado" }`
`404`: `Registro nao encontrado!` (token válido, mas usuário foi deletado).

### 3.3 Quem realmente exige autenticação

| Rota | Exige token? | Exige admin? |
|---|---|---|
| `POST /usuarios/` | Sim | **Sim** |
| `PUT /usuarios/{id}` | Sim | **Sim** |
| `DELETE /usuarios/{id}` | Sim | **Sim** |
| Todas as demais rotas | **Não** | Não |

Ou seja: listar usuários, criar/editar/deletar fornecedores, matérias-primas, lotes, compras,
pedidos, ordens, previsões etc. **funciona sem token**. O token é enviado pelo cliente por
consistência, mas o servidor ignora fora de `/usuarios/*`.

**Implicação de segurança para o app:** não use o servidor como fonte de autorização de UI.
Se o app precisa esconder funções de não-admin, use o campo `admin` retornado por `/auth/me`.

### 3.4 ⚠️ Usuário demo reseta o banco

O usuário de **id fixo `5`** (e-mail `demo`) dispara, a cada login, a execução de
`api/services/dependencies/seed_demo.sql`, que faz `TRUNCATE` em todas as tabelas de negócio e
recarrega o seed.

- Nunca use o login demo em ambiente com dados reais.
- O app **não deve** oferecer atalho para esse usuário em produção.
- A senha do demo não é documentada; não tente adivinhar.

### 3.5 Criação de usuários

- `POST /usuarios/` **sempre cria `admin: false`** (não há campo para criar admin).
- A senha é hasheada no backend.
- `PUT /usuarios/{id}` altera apenas `nome`, `telefone`, `email` — **não altera senha nem admin**.
- `DELETE /usuarios/{id}` só apaga usuários com `admin = false`; para admin, retorna `Ok` sem apagar.
- Não existe endpoint de “alterar minha senha”.
- A tabela `usuarios` **não é criada pelo `setup_completo.sql`** (ver §8).

### 3.6 Exemplo de fluxo de login (TypeScript)

```ts
const res = await fetch(`${BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, senha }),
});
const data = await res.json();

if (res.ok && data.status === "Autenticado" && data.token) {
  localStorage.setItem("axion_token", data.token);
} else {
  throw new Error("Credenciais inválidas");
}
```

---

## 4. Modelo de dados

### 4.1 Entidades e campos retornados pela API

Tipos em JSON: `int`, `float`, `str`, `bool`, `date` = `"YYYY-MM-DD"`,
`datetime` = `"YYYY-MM-DD HH:MM:SS"` (separador **espaço**, sem timezone).

#### Usuário (`usuarios`)
| Campo | Tipo | Observação |
|---|---|---|
| `id` | int | PK |
| `nome` | str | |
| `telefone` | str | |
| `email` | str | usado no login |
| `admin` | bool | |
| `senha` | — | hash; **nunca retornado** |

#### Fornecedor (`fornecedores`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `razao_social` | str | não (obrigatório no POST) |
| `nome_fantasia` | str | sim |
| `cnpj` | str | sim |
| `telefone` | str | sim |
| `email` | str | sim |
| `prazo_entrega_dias` | int | sim |
| `ativo` | bool | não (default `true`) |

#### Matéria-prima (`materias_primas`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `codigo` | str | sim (único no banco) |
| `nome` | str | não no banco; Pydantic aceita omitir → 500 |
| `unidade` | str | sim (`g`, `kg`, `un`, …) |
| `estoque_minimo` | float | sim |
| `estoque_maximo` | float | sim |
| `consumo_medio_mensal` | float | sim (mantido por trigger) |
| `ativo` | bool | não (default `true`) |
| `consumo_mensal` | array | **calculado**, só no `GET /materias-primas/` |
| `estoque_atual` | float | **calculado**, só quando `estoqueBaixo=true` |
| `lotes_vencidos` | int | **calculado**, só quando `vencendo=true` |

Formato de `consumo_mensal`:

```json
[{ "mes": "2026-04", "consumo": 2050.0 }, ...]
```

São os 6 meses fechados anteriores ao mês corrente.

#### Lote (`lotes`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `materia_prima_id` | int | não (obrigatório no POST) |
| `fornecedor_id` | int | sim |
| `numero_lote` | str | sim |
| `quantidade_inicial` | float | sim |
| `quantidade_atual` | float | sim (se omitido/0 no POST, vira `quantidade_inicial`) |
| `data_fabricacao` | date | sim |
| `data_validade` | date | sim |
| `data_recebimento` | date | sim |
| `valor_unitario` | float | sim |

> As datas são serializadas com `str(...)`. Se forem `NULL`, o JSON pode conter a **string
> `"None"`** em vez de `null`. Trate `"None"` como nulo no cliente.

#### Movimentação de estoque (`movimentacoes_estoque`)
| Campo | Tipo |
|---|---|
| `id` | int |
| `lote_id` | int |
| `tipo` | str (`ENTRADA` / `SAIDA`) |
| `quantidade` | float |
| `data_movimento` | datetime |
| `observacao` | str (pode ser `null`) |

#### Compra (`compras`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `fornecedor_id` | int | não (obrigatório no POST) |
| `data_compra` | date | sim (default = hoje na criação) |
| `previsao_entrega` | date | sim |
| `data_recebimento` | date | sim |
| `status` | str | default `PENDENTE` |
| `itens` | array | **só no `GET /compras/{id}`** |

Item de compra: `{ "id": int, "materia_prima_id": int, "quantidade": float, "valor_unitario": float|null }`.

#### Fórmula (`formulas`)
| Campo | Tipo |
|---|---|
| `id` | int |
| `codigo` | str\|null |
| `descricao` | str\|null |
| `categoria` | str\|null |
| `ativa` | bool (default `true`) |
| `itens` | array — **só no `GET /formulas/{id}`** |

Item de fórmula: `{ "id": int, "materia_prima_id": int, "quantidade": float, "unidade": str|null }`.

#### Cliente (`clientes`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `nome` | str | não |
| `telefone` | str | sim |
| `email` | str | sim |
| `cnpj` | str | sim — **mesma coluna guarda CPF (11) ou CNPJ (14)** |

#### Pedido (`pedidos`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `cliente_id` | int | não (obrigatório no POST) |
| `data_pedido` | datetime | gerado no servidor |
| `status` | str | default `PENDENTE` |
| `data_entrega` | date | sim |
| `itens` | array | **só no `GET /pedidos/{id}`** |

Item de pedido: `{ "id": int, "formula_id": int, "quantidade": int }` (inteiro!).

#### Ordem de produção (`ordens_producao`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `pedido_id` | int | sim |
| `data_inicio` | datetime | sim |
| `data_fim` | datetime | sim |
| `status` | str | default `PENDENTE` |

> O `GET /ordens-producao/{id}` **não** retorna os consumos da ordem.

#### Histórico de consumo (`historico_consumo`) — somente leitura
`{ "id": int, "materia_prima_id": int, "data": date, "quantidade": float }`

#### Previsão (`previsoes_consumo`)
`{ "id", "materia_prima_id", "data_previsao", "periodo_inicio", "periodo_fim", "consumo_previsto", "confianca", "modelo_utilizado" }`

#### Sugestão de compra (`sugestoes_compra`)
`{ "id", "materia_prima_id", "data_sugestao", "quantidade_sugerida", "motivo", "status" }`

#### Alerta (`alertas`)
| Campo | Tipo | Nulo? |
|---|---|---|
| `id` | int | não |
| `tipo` | str | sim |
| `materia_prima_id` | int | **sim na prática** |
| `lote_id` | int | **sim na prática** |
| `descricao` | str | sim |
| `prioridade` | str | sim |
| `resolvido` | bool | default `false` |
| `data_alerta` | datetime | |

> Apesar do ORM tipar `materia_prima_id`/`lote_id` como `int`, a API retorna `null` nesses campos
> em vários alertas. Tipar como `number | null`.

### 4.2 Relacionamentos

```
fornecedores 1─N lotes N─1 materias_primas
fornecedores 1─N compras 1─N compra_itens N─1 materias_primas
compras 1─N lotes            (ao receber, gera lotes)
lotes 1─N movimentacoes_estoque
formulas 1─N formula_itens N─1 materias_primas
clientes 1─N pedidos 1─N pedido_itens N─1 formulas
pedidos 1─N ordens_producao 1─N consumo_producao N─1 lotes
materias_primas 1─N historico_consumo
materias_primas 1─N previsoes_consumo
materias_primas 1─N sugestoes_compra
alertas → materia_prima_id / lote_id (opcionais)
```

---

## 5. Catálogo completo de endpoints

Legenda: **JSON** = corpo JSON; **TXT** = texto puro; **PNG** = imagem.

### 5.1 Diagnósticos

| Método | Rota | Resposta |
|---|---|---|
| GET | `/diagnosticos/informacao_servidor` | TXT com SO/plataforma (usado na tela de login) |
| GET | `/diagnosticos/status_banco` | JSON de failover |
| GET | `/diagnosticos/axionphare_desktop` | JSON `{ "intendidade": "...", "empresa": "..." }` |

`/diagnosticos/status_banco`:

```json
{
  "banco_ativo": "primary",
  "primario_disponivel": true,
  "total_failovers": 0,
  "total_recuperacoes": 0
}
```

`banco_ativo` pode ser `"primary"` ou `"supabase"`.

### 5.2 Autenticação

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/login` | `{email, senha}` | `{status, token}` |
| POST | `/auth/logout` | — | `{status}` |
| POST | `/auth/refresh` | — | `{token}` |
| GET | `/auth/me` | — | usuário |

Detalhes na seção 3.

### 5.3 Usuários

| Método | Rota | Auth | Resposta |
|---|---|---|---|
| GET | `/usuarios/` | pública | array de usuários |
| GET | `/usuarios/{id}` | pública | **array** com 0 ou 1 usuário |
| POST | `/usuarios/` | admin | TXT `Ok` |
| PUT | `/usuarios/{id}` | admin | TXT `Ok` |
| DELETE | `/usuarios/{id}` | admin | TXT `Ok` |

- `GET /usuarios/{id}` retorna `[]` para id inexistente (não 404).
- `POST` body: `{nome, telefone, email, senha}` — todos obrigatórios.
- `PUT` body: `{nome, telefone, email}` — todos obrigatórios.
- Erros: `403` texto `Somente Administradores podem executar esta acao!`; `400` `Campos pendentes!`.

### 5.4 Fornecedores

| Método | Rota | Query/Body | Resposta |
|---|---|---|---|
| GET | `/fornecedores/` | `nome`, `ativo` | array |
| GET | `/fornecedores/{id}` | — | objeto ou 404 |
| POST | `/fornecedores/` | body | TXT `Ok` |
| PUT | `/fornecedores/{id}` | body | TXT `Ok` |
| DELETE | `/fornecedores/{id}` | — | TXT `Ok` |

Body (POST/PUT):

```json
{
  "razao_social": "Quimio Farma Distribuidora Ltda",
  "nome_fantasia": "Quimio Farma",
  "cnpj": "12.345.678/0001-90",
  "telefone": "(11) 3123-4000",
  "email": "vendas@quimiofarma.com.br",
  "prazo_entrega_dias": 3,
  "ativo": true
}
```

Somente `razao_social` é obrigatório. Filtro `nome` usa `ILIKE %nome%` sobre `nome_fantasia`.

### 5.5 Matérias-primas

| Método | Rota | Query/Body | Resposta |
|---|---|---|---|
| GET | `/materias-primas/` | `nome`, `estoqueBaixo`, `vencendo` | array (com `consumo_mensal`) |
| GET | `/materias-primas/{id}` | — | objeto ou 404 |
| POST | `/materias-primas/` | body | TXT `Ok` |
| PUT | `/materias-primas/{id}` | body | TXT `Ok` |
| DELETE | `/materias-primas/{id}` | — | TXT `Ok` |

Body:

```json
{
  "codigo": "MP-001",
  "nome": "Omeprazol",
  "unidade": "g",
  "estoque_minimo": 500.0,
  "estoque_maximo": 4000.0,
  "consumo_medio_mensal": 2200.0,
  "ativo": true
}
```

Filtros:

- `?nome=ome` → `ILIKE %ome%`.
- `?estoqueBaixo=true` → só itens cuja soma dos lotes < `estoque_minimo`; adiciona `estoque_atual`.
- `?vencendo=true` → só itens com lotes **já vencidos** (`data_validade <= hoje`) e saldo > 0;
  adiciona `lotes_vencidos`. **Não é “vencendo em N dias”.**

### 5.6 Lotes

| Método | Rota | Query/Body | Resposta |
|---|---|---|---|
| GET | `/lotes/` | `vencimento`, `materiaPrima`, `fornecedor` | array |
| GET | `/lotes/{id}` | — | objeto ou 404 |
| POST | `/lotes/` | body | TXT `Ok` |
| PUT | `/lotes/{id}` | body | TXT `Ok` |
| DELETE | `/lotes/{id}` | — | TXT `Ok` |

Body:

```json
{
  "materia_prima_id": 1,
  "fornecedor_id": 1,
  "numero_lote": "LOT-OME-001",
  "quantidade_inicial": 2500.0,
  "quantidade_atual": 2500.0,
  "data_fabricacao": "2026-03-01",
  "data_validade": "2028-03-01",
  "data_recebimento": "2026-06-03",
  "valor_unitario": 0.95
}
```

- `vencimento=30` filtra `data_validade <= hoje + 30 dias` (inclui vencidos).
- `materiaPrima` e `fornecedor` são IDs inteiros.

### 5.7 Estoque

| Método | Rota | Corpo/Query | Resposta |
|---|---|---|---|
| GET | `/estoque/` | — | array agregado por matéria-prima |
| GET | `/estoque/{materia_prima_id}` | — | array de lotes `{id, quantidade_atual}` |
| GET | `/estoque/movimentacoes` | — | array de movimentações |
| POST | `/estoque/movimentacoes` | body | TXT `Ok` ou 400 |
| GET | `/estoque/gerar_predicacao_compra` | — | JSON da IA (pode demorar) |

`GET /estoque/`:

```json
[{ "materia_prima_id": 1, "nome": "Omeprazol", "estoque": 3450.0 }]
```

`POST /estoque/movimentacoes`:

```json
{
  "loteId": 12,
  "tipo": "SAIDA",
  "quantidade": 3.5,
  "observacao": "Producao OP-152"
}
```

> Atenção ao camelCase: aqui é `loteId` (nas demais rotas é snake_case).

- `tipo` deve ser exatamente `"ENTRADA"` ou `"SAIDA"`.
- `SAIDA` valida existência e saldo → `400 {"erro": "Lote nao encontrado"}` ou
  `400 {"erro": "Saldo insuficiente no lote"}`.
- `ENTRADA` **não valida a existência do lote**: lote inexistente gera erro de FK (`500`).
- Qualquer outro `tipo` **não altera o saldo**, mas grava a movimentação.

`/estoque/gerar_predicacao_compra` monta o payload de todas as matérias-primas e chama
Gemini/Groq. Pode levar até ~60 s e retorna `200` com `{"erro": "..."}` em caso de falha.

### 5.8 Compras

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/compras/` | — | array |
| GET | `/compras/{id}` | — | objeto com `itens` ou 404 |
| POST | `/compras/` | body | `{ "id": n, "status": "Ok" }` |
| PUT | `/compras/{id}` | body | TXT `Ok` |
| DELETE | `/compras/{id}` | — | TXT `Ok` |
| POST | `/compras/{id}/itens` | body | TXT `Ok` |
| POST | `/compras/{id}/receber` | — | TXT `Ok` ou 400 |
| POST | `/compras/{id}/cancelar` | — | TXT `Ok` ou 400 |

Criar compra:

```json
{
  "fornecedor_id": 1,
  "data_compra": "2026-10-29",
  "previsao_entrega": "2026-11-05",
  "status": "PENDENTE"
}
```

Adicionar item:

```json
{ "materia_prima_id": 1, "quantidade": 2500.0, "valor_unitario": 0.95 }
```

Efeitos de `receber` (transação única):

1. Para cada item, cria um lote com `numero_lote = "COMPRA-{compra_id}-{item_id}"`,
   `quantidade_inicial = quantidade_atual = item.quantidade`, `fornecedor_id` da compra,
   `data_recebimento = hoje`, `valor_unitario` do item, **sem data de validade**.
2. Insere movimentação `ENTRADA` com observação `"Recebimento da compra #id"`.
3. Marca a compra como `RECEBIDA` e define `data_recebimento = hoje`.

Erros: `400 {"erro": "Compra nao encontrada"}` / `{"erro": "Compra ja recebida"}`.
`cancelar` só muda o status para `CANCELADA` (não estorna estoque).

### 5.9 Fórmulas

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/formulas/` | — | array |
| GET | `/formulas/{id}` | — | objeto com `itens` ou 404 |
| POST | `/formulas/` | body | `{ "id": n, "status": "Ok" }` |
| PUT | `/formulas/{id}` | body | TXT `Ok` |
| DELETE | `/formulas/{id}` | — | TXT `Ok` |
| GET | `/formulas/{id}/itens` | — | array |
| POST | `/formulas/{id}/itens` | body | TXT `Ok` |
| PUT | `/formulas/{id}/itens/{item_id}` | body | TXT `Ok` |
| DELETE | `/formulas/{id}/itens/{item_id}` | — | TXT `Ok` |

Corpo da fórmula: `{ "codigo", "descricao", "categoria", "ativa" }` (todos opcionais).
Corpo do item: `{ "materia_prima_id": 1, "quantidade": 20.0, "unidade": "mg/cap" }`.
No `PUT` do item, apenas `quantidade` e `unidade`; o `id` da fórmula na URL é ignorado.

### 5.10 Clientes

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/clientes/` | — | array |
| GET | `/clientes/{id}` | — | objeto ou 404 |
| POST | `/clientes/` | body | TXT `Ok` |
| PUT | `/clientes/{id}` | body | TXT `Ok` |
| DELETE | `/clientes/{id}` | — | TXT `Ok` |

```json
{ "nome": "Clinica Vida Plena", "telefone": "(11) 98765-4321", "email": "contato@...", "cnpj": null }
```

`cnpj` aceita CPF (11 dígitos) ou CNPJ (14), sem validação de formato.

### 5.11 Pedidos

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/pedidos/` | — | array |
| GET | `/pedidos/{id}` | — | objeto com `itens` ou 404 |
| POST | `/pedidos/` | body | `{ "id": n, "status": "Ok" }` |
| PUT | `/pedidos/{id}` | body | TXT `Ok` |
| DELETE | `/pedidos/{id}` | — | TXT `Ok` |
| GET | `/pedidos/{id}/itens` | — | array |
| POST | `/pedidos/{id}/itens` | body | TXT `Ok` |

Criar pedido: `{ "cliente_id": 1, "status": "PENDENTE", "data_entrega": "2026-11-10" }`.
Item: `{ "formula_id": 1, "quantidade": 300 }` — `quantidade` é **inteiro**.

### 5.12 Ordens de produção

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/ordens-producao/` | — | array |
| GET | `/ordens-producao/{id}` | — | objeto ou 404 |
| POST | `/ordens-producao/` | body | `{ "id": n, "status": "Ok" }` |
| PUT | `/ordens-producao/{id}` | body | TXT `Ok` |
| DELETE | `/ordens-producao/{id}` | — | TXT `Ok` |
| POST | `/ordens-producao/{id}/iniciar` | — | TXT `Ok` ou 400 |
| POST | `/ordens-producao/{id}/finalizar` | — | TXT `Ok` ou 400 |
| POST | `/ordens-producao/{id}/cancelar` | — | TXT `Ok` ou 400 |
| POST | `/ordens-producao/{id}/consumos` | body | TXT `Ok` ou 400 |

Criar: `{ "pedido_id": 1, "status": "PENDENTE" }` (`pedido_id` opcional).
Consumo: `{ "lote_id": 12, "quantidade": 3.5 }`.

`iniciar` → `EM_PRODUCAO` + `data_inicio = agora`.
`finalizar` → `FINALIZADA` + `data_fim = agora`.
`cancelar` → `CANCELADA`.
`consumos` → insere em `consumo_producao`, decrementa `lotes.quantidade_atual` e grava
movimentação `SAIDA` com observação `"Consumo na ordem de producao #id"`.

Erros de consumo: `{"erro": "Lote nao encontrado"}` / `{"erro": "Saldo insuficiente no lote"}`.
Erros de ação: `{"erro": "Ordem nao encontrada"}`.

### 5.13 Consumos (histórico)

| Método | Rota | Query | Resposta |
|---|---|---|---|
| GET | `/consumos/` | `inicio`, `fim`, `materiaPrima` | array |

Exemplo: `/consumos/?inicio=2026-09-01&fim=2026-09-30&materiaPrima=1`.

### 5.14 Previsões

| Método | Rota | Corpo/Query | Resposta |
|---|---|---|---|
| GET | `/previsoes/` | — | array |
| GET | `/previsoes/materia-prima/{id}` | — | array (sem `materia_prima_id`) |
| POST | `/previsoes/gerar` | body | TXT `Ok` |
| POST | `/previsoes/gerar-automatica` | `inicio`, `fim` (query) | TXT |

`POST /previsoes/gerar`:

```json
{
  "materia_prima_id": 1,
  "periodo_inicio": "2026-11-01",
  "periodo_fim": "2026-11-30",
  "consumo_previsto": 2400.0,
  "confianca": 90.0,
  "modelo_utilizado": "MEDIA_MOVEL"
}
```

`POST /previsoes/gerar-automatica?inicio=2026-11-01&fim=2026-11-30`:

- Calcula a média dos últimos 6 meses fechados por matéria-prima (`vw_consumo_mensal`).
- Apaga previsões existentes com `periodo_inicio >= inicio` daquela matéria-prima.
- Insere com `confianca = 90.0` e `modelo_utilizado = "MEDIA_MOVEL"`.
- Retorna texto: `Ok - N previao(oes) gerada(s)` (sic) ou `Nenhum consumo historico encontrado`.

### 5.15 Sugestões de compra

| Método | Rota | Resposta |
|---|---|---|
| GET | `/sugestoes-compra/` | array |
| POST | `/sugestoes-compra/gerar` | TXT `N sugestoes geradas` |
| POST | `/sugestoes-compra/{id}/aprovar` | TXT `Ok` ou 400 |
| POST | `/sugestoes-compra/{id}/rejeitar` | TXT `Ok` ou 400 |

Regra de geração: para cada matéria-prima **ativa** com `estoque_total < estoque_minimo`,
cria sugestão com `quantidade_sugerida = estoque_maximo - estoque_total`, status `PENDENTE`.
Aprovar/rejeitar **apenas mudam o status**; não criam compra.

### 5.16 Alertas

| Método | Rota | Query | Resposta |
|---|---|---|---|
| GET | `/alertas/` | `tipo`, `prioridade`, `resolvido` | array |
| POST | `/alertas/{id}/resolver` | — | TXT `Ok` ou 400 |

Não existe endpoint para criar alertas. Eles vêm do seed/banco.

### 5.17 Dashboard

| Método | Rota | Resposta |
|---|---|---|
| GET | `/dashboard/` | KPIs gerais |
| GET | `/dashboard/estoque` | mesma estrutura de `/estoque/` |
| GET | `/dashboard/compras` | `{pendentes, recebidas, canceladas}` |
| GET | `/dashboard/producao` | `{pendentes, em_producao, finalizadas, canceladas}` |
| GET | `/dashboard/previsoes` | `{total_previsoes, total_consumo_previsto}` |
| GET | `/dashboard/alertas` | `{total, nao_resolvidos, alta_prioridade}` |

`GET /dashboard/`:

```json
{
  "total_materias_primas": 20,
  "compras_pendentes": 6,
  "ordens_em_producao": 4,
  "alertas_ativos": 15
}
```

> `ordens_em_producao` considera `EM_PRODUCAO` **e** `EM_ANDAMENTO`.
> Já `/dashboard/producao` só conta `PENDENTE`, `EM_PRODUCAO`, `FINALIZADA`, `CANCELADA` —
> se o banco usar os status do seed (`AGENDADA`, `EM_ANDAMENTO`, `CONCLUIDA`), os números ficam
> zerados. Ver §8.

### 5.18 Relatórios

| Método | Rota | Query | Conteúdo |
|---|---|---|---|
| GET | `/relatorios/consumo` | `inicio`, `fim` | total consumido por matéria-prima |
| GET | `/relatorios/estoque` | — | estoque atual por matéria-prima |
| GET | `/relatorios/vencimentos` | — | lotes com saldo, ordenados por validade |
| GET | `/relatorios/compras` | `inicio`, `fim` | compras por período |
| GET | `/relatorios/producao` | `inicio`, `fim` | ordens por `data_inicio` |
| GET | `/relatorios/previsoes` | — | previsões com nome da matéria-prima |

### 5.19 Gráficos

| Método | Rota | Resposta |
|---|---|---|
| GET | `/graficos/consumo` | `image/png` (fundo transparente, tema escuro) |

Gerado com pandas + matplotlib no backend. A SPA não usa esse endpoint (usa ApexCharts).

---

## 6. Fluxos de negócio

### 6.1 Ciclo completo de compra

```
POST /compras/                     → cria compra PENDENTE (retorna id)
POST /compras/{id}/itens (N vezes) → adiciona matérias-primas e quantidades
POST /compras/{id}/receber         → cria lotes + ENTRADA + status RECEBIDA
GET  /estoque/                     → confere saldo consolidado
GET  /lotes/?materiaPrima={mp}     → confere lotes criados (COMPRA-{id}-{item})
```

### 6.2 Ciclo de produção

```
POST /pedidos/                          → cria pedido
POST /pedidos/{id}/itens                → adiciona fórmulas
POST /ordens-producao/                  → cria ordem (pedido_id)
POST /ordens-producao/{id}/iniciar      → EM_PRODUCAO
POST /ordens-producao/{id}/consumos     → baixa lote + SAIDA (N vezes)
POST /ordens-producao/{id}/finalizar    → FINALIZADA
```

### 6.3 Análise e reposição

```
POST /previsoes/gerar-automatica   → média móvel 6 meses
GET  /previsoes/                   → consulta
POST /sugestoes-compra/gerar       → regra estoque < mínimo
GET  /sugestoes-compra/            → consulta
POST /sugestoes-compra/{id}/aprovar
GET  /alertas/?resolvido=false
POST /alertas/{id}/resolver
```

### 6.4 Ajuste manual de estoque

```
POST /estoque/movimentacoes  { loteId, tipo: "ENTRADA"|"SAIDA", quantidade, observacao }
```

---

## 7. Enumerações observadas

A API **não valida** esses valores (são `VARCHAR` livres), mas os dados existentes usam:

| Campo | Valores vistos |
|---|---|
| `compras.status` | `PENDENTE`, `RECEBIDA`, `CANCELADA` |
| `ordens_producao.status` | `PENDENTE`, `EM_PRODUCAO`, `FINALIZADA`, `CANCELADA` (fluxo do código) / `AGENDADA`, `EM_ANDAMENTO`, `CONCLUIDA` (seed) |
| `pedidos.status` | `NOVO`, `AGUARDANDO`, `EM_PRODUCAO`, `CONCLUIDO` (seed) / `PENDENTE` (default do código) |
| `alertas.tipo` | `REPOSICAO`, `VENCIMENTO`, `ESTOQUE_MINIMO` |
| `alertas.prioridade` | `ALTA`, `MEDIA`, `BAIXA` |
| `sugestoes_compra.status` | `PENDENTE`, `APROVADA`, `REJEITADA`, `CANCELADA` |
| `movimentacoes_estoque.tipo` | `ENTRADA`, `SAIDA` |
| `previsoes_consumo.modelo_utilizado` | `MEDIA_MOVEL`, `media_movel`, `suavizacao_exponencial`, `sazonal` |
| `materias_primas.unidade` | `g`, `kg`, `un`, `mg/cap`, `cap` |

**Recomendação:** no cliente, use `string` com fallback visual; não use enum fechado que quebre
com valores novos.

---

## 8. Armadilhas e comportamentos inesperados

1. **Barra final** — coleções exigem `/`; sem ela, `307`. Em clientes HTTP que não seguem
   redirect em POST, a requisição falha silenciosamente. Sempre use a barra.
2. **Sem CORS** — app web em outra origem não funciona sem ajuste no backend/proxy.
3. **Quase tudo é público** — não confie na API para autorização; só `/usuarios` mutações
   verificam admin.
4. **Login demo (id 5) apaga e recarrega o banco** — nunca use em produção.
5. **Tokens em memória** — restart invalida sessões; novo login invalida o token anterior do
   mesmo e-mail.
6. **`GET /usuarios/{id}` retorna array**, não objeto; id inexistente retorna `[]` com 200.
7. **`"None"` como string** — campos de data nulos em lotes/compras podem virar `"None"` por causa
   de `str(None)`. Normalize para `null`.
8. **`GET /estoque/{id}` não é o saldo consolidado** — retorna os lotes `{id, quantidade_atual}`.
   Para saldo por matéria-prima use `/estoque/` ou `/relatorios/estoque`.
9. **Status do seed ≠ status do dashboard** — `/dashboard/producao` pode retornar zeros mesmo com
   ordens `EM_ANDAMENTO`/`CONCLUIDA` no banco.
10. **Sem paginação** — listas grandes vêm inteiras; pagine no cliente.
11. **DELETE com dependências** — não há `ON DELETE CASCADE` para todas as relações; excluir
    fornecedor/matéria-prima com lotes vinculados pode retornar `500`.
12. **Mutações retornam texto `Ok`** — `POST /clientes/`, `/fornecedores/`, `/lotes/`,
    `/materias-primas/`, itens etc. Use `Content-Type` para decidir como parsear.
13. **`PUT` com `status` omitido volta para `PENDENTE`** em compras/pedidos/ordens, pois o campo
    tem default no Pydantic. Sempre envie o status atual ao editar.
14. **`POST /previsoes/gerar-automatica` tem mensagem com erro de digitação**:
    `"Ok - N previao(oes) gerada(s)"`. Não faça parsing rígido; use prefixo `Ok`.
15. **Endpoint de IA retorna 200 mesmo em falha** com `{"erro": "..."}` e pode demorar ~60 s.
16. **`tipo` inválido em movimentação** grava histórico sem alterar saldo. Valide no cliente.
17. **`vencendo=true`** significa “já vencido”, não “a vencer”.
18. **`setup_completo.sql` não cria nem popula `usuarios`** — um banco novo ficará sem login até
    criar a tabela/usuários manualmente. (A tabela existe no banco hospedado atual.)
19. **Failover Supabase** — em modo fallback, datas podem chegar como string e escritas que usam
    `currval('lotes_id_seq')` (receber compra) podem falhar. Trate erros de escrita.
20. **Gráfico PNG** — `/graficos/consumo` não retorna JSON; trate `image/png`.
21. **Sem versionamento de API** — mudanças podem quebrar o cliente; fixe a URL e monitore
    `/openapi.json`.
22. **E-mails duplicados** — não há constraint de unicidade; login usa o primeiro registro.
23. **`GET /usuarios/` é público e expõe e-mails/telefones** — considere isso ao expor a API.

---

## 9. Receitas prontas (curl)

### 9.1 Login e consulta do usuário

```bash
BASE=http://localhost:8000

TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@localhost","senha":"SUA_SENHA"}' | jq -r .token)

curl -s "$BASE/auth/me" -H "Authorization: Bearer $TOKEN"
```

### 9.2 Listar e criar fornecedor

```bash
curl -s "$BASE/fornecedores/?ativo=true"

curl -s -X POST "$BASE/fornecedores/" \
  -H 'Content-Type: application/json' \
  -d '{"razao_social":"Nova Distribuidora","nome_fantasia":"Nova","ativo":true}'
```

### 9.3 Compra completa

```bash
COMPRA=$(curl -s -X POST "$BASE/compras/" \
  -H 'Content-Type: application/json' \
  -d '{"fornecedor_id":1,"previsao_entrega":"2026-11-10"}' | jq -r .id)

curl -s -X POST "$BASE/compras/$COMPRA/itens" \
  -H 'Content-Type: application/json' \
  -d '{"materia_prima_id":1,"quantidade":1000,"valor_unitario":0.95}'

curl -s -X POST "$BASE/compras/$COMPRA/receber"
curl -s "$BASE/compras/$COMPRA"
```

### 9.4 Produção

```bash
curl -s -X POST "$BASE/ordens-producao/" \
  -H 'Content-Type: application/json' \
  -d '{"pedido_id":1}'

curl -s -X POST "$BASE/ordens-producao/1/iniciar"
curl -s -X POST "$BASE/ordens-producao/1/consumos" \
  -H 'Content-Type: application/json' \
  -d '{"lote_id":1,"quantidade":10}'
curl -s -X POST "$BASE/ordens-producao/1/finalizar"
```

### 9.5 Previsão + sugestão

```bash
curl -s -X POST "$BASE/previsoes/gerar-automatica?inicio=2026-11-01&fim=2026-11-30"
curl -s "$BASE/previsoes/"
curl -s -X POST "$BASE/sugestoes-compra/gerar"
curl -s "$BASE/sugestoes-compra/"
```

---

## 10. Esqueleto de cliente (TypeScript)

Um cliente mínimo, com tratamento de JSON/texto/erros e token:

```ts
type Json = Record<string, unknown> | unknown[];

export interface ApiError {
  status: number;
  message: string;
  body: unknown;
}

export class AxionClient {
  private token: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setToken(token: string | null) { this.token = token; }
  getToken() { return this.token; }

  private url(path: string) {
    return `${this.baseUrl.replace(/\/+$/, "")}${path}`;
  }

  async request<T = Json>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const res = await fetch(this.url(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "follow", // segue o 307 da barra final
    });

    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      throw {
        status: res.status,
        message: this.mensagemErro(data, res.status),
        body: data,
      } satisfies ApiError;
    }
    return data as T;
  }

  private mensagemErro(data: unknown, status: number): string {
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.erro === "string") return obj.erro;
      if (typeof obj.status === "string") return obj.status;
      if (Array.isArray(obj.detail)) {
        return obj.detail
          .map((d) => (d as { msg?: string }).msg ?? "campo inválido")
          .join("; ");
      }
      if (typeof obj.detail === "string") return obj.detail;
    }
    return `HTTP ${status}`;
  }

  // ── Auth ──────────────────────────────────────────────────────────────
  async login(email: string, senha: string) {
    const r = await this.request<{ status: string; token: string | null }>(
      "POST", "/auth/login", { email, senha },
    );
    if (r.status !== "Autenticado" || !r.token) throw new Error("Login inválido");
    this.token = r.token;
    return r.token;
  }
  me() { return this.request("GET", "/auth/me"); }
  logout() { return this.request("POST", "/auth/logout"); }
  refresh() {
    return this.request<{ token: string }>("POST", "/auth/refresh")
      .then((r) => { this.token = r.token; return r.token; });
  }

  // ── Cadastros ─────────────────────────────────────────────────────────
  fornecedores(q = "") { return this.request("GET", `/fornecedores/${q}`); }
  criarFornecedor(d: unknown) { return this.request("POST", "/fornecedores/", d); }
  atualizarFornecedor(id: number, d: unknown) { return this.request("PUT", `/fornecedores/${id}`, d); }
  deletarFornecedor(id: number) { return this.request("DELETE", `/fornecedores/${id}`); }

  materiasPrimas(q = "") { return this.request("GET", `/materias-primas/${q}`); }
  lotes(q = "") { return this.request("GET", `/lotes/${q}`); }
  clientes() { return this.request("GET", "/clientes/"); }
  formulas() { return this.request("GET", "/formulas/"); }

  // ── Operações ─────────────────────────────────────────────────────────
  estoque() { return this.request("GET", "/estoque/"); }
  movimentacoes() { return this.request("GET", "/estoque/movimentacoes"); }
  movimentar(d: { loteId: number; tipo: "ENTRADA" | "SAIDA"; quantidade: number; observacao?: string }) {
    return this.request("POST", "/estoque/movimentacoes", d);
  }

  compras() { return this.request("GET", "/compras/"); }
  compra(id: number) { return this.request("GET", `/compras/${id}`); }
  criarCompra(d: unknown) { return this.request("POST", "/compras/", d); }
  itemCompra(id: number, d: unknown) { return this.request("POST", `/compras/${id}/itens`, d); }
  receberCompra(id: number) { return this.request("POST", `/compras/${id}/receber`); }
  cancelarCompra(id: number) { return this.request("POST", `/compras/${id}/cancelar`); }

  pedidos() { return this.request("GET", "/pedidos/"); }
  ordens() { return this.request("GET", "/ordens-producao/"); }
  iniciarOrdem(id: number) { return this.request("POST", `/ordens-producao/${id}/iniciar`); }
  consumir(id: number, d: { lote_id: number; quantidade: number }) {
    return this.request("POST", `/ordens-producao/${id}/consumos`, d);
  }
  finalizarOrdem(id: number) { return this.request("POST", `/ordens-producao/${id}/finalizar`); }

  // ── Análise ───────────────────────────────────────────────────────────
  dashboard() { return this.request("GET", "/dashboard/"); }
  alertas(q = "") { return this.request("GET", `/alertas/${q}`); }
  resolverAlerta(id: number) { return this.request("POST", `/alertas/${id}/resolver`); }
  previsoes() { return this.request("GET", "/previsoes/"); }
  gerarPrevisaoAutomatica(inicio?: string, fim?: string) {
    const q = new URLSearchParams();
    if (inicio) q.set("inicio", inicio);
    if (fim) q.set("fim", fim);
    return this.request("POST", `/previsoes/gerar-automatica?${q}`);
  }
  sugestoes() { return this.request("GET", "/sugestoes-compra/"); }
  gerarSugestoes() { return this.request("POST", "/sugestoes-compra/gerar"); }
  aprovarSugestao(id: number) { return this.request("POST", `/sugestoes-compra/${id}/aprovar`); }
  rejeitarSugestao(id: number) { return this.request("POST", `/sugestoes-compra/${id}/rejeitar`); }
}
```

### 10.1 Persistência do token

- Guarde o token no armazenamento seguro da plataforma (Keychain/Keystore/localStorage).
- Ao receber `401` em `/auth/me`, apague o token e volte para o login.
- Como não há expiração, defina um timeout de inatividade no app (a SPA usa 1 minuto por padrão,
  configurável).
- Após restart do backend, o token antigo retorna `401`; peça login novamente.

### 10.2 Normalização de dados

```ts
const nuloSeNone = (v: unknown) => (v === "None" ? null : v);
const numero = (v: unknown) => (v == null ? null : Number(v));
```

Trate `quantidade`, `valor_unitario`, `estoque_*`, `consumo_*` como `number` e IDs como `number`.

### 10.3 Cliente Flutter/Dart

O repositório já tem um scaffold Flutter em `app_mobile/` (`name: axionphare_glance`, apenas
`Hello World`). Para integrar:

**Dependências sugeridas** (`pubspec.yaml`):

```yaml
dependencies:
  http: ^1.2.0
  flutter_secure_storage: ^9.2.2   # ou shared_preferences em protótipos
```

**Base URL por plataforma:**

| Alvo | Base URL |
|---|---|
| Emulador Android | `http://10.0.2.2:8000` |
| Simulador iOS / desktop | `http://localhost:8000` |
| Dispositivo físico | `http://<IP-LAN-da-máquina>:8000` |
| Flutter Web | mesma origem do backend ou resolver CORS |

> Em desenvolvimento, HTTP puro exige liberar tráfego cleartext:
> Android → `android:usesCleartextTraffic="true"` no `AndroidManifest.xml`;
> iOS → `NSAppTransportSecurity/NSAllowsArbitraryLoads` no `Info.plist`.
> Em produção, use HTTPS.

**Cliente mínimo:**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  ApiException(this.status, this.body);
  final int status;
  final dynamic body;

  String get message {
    if (body is String) return body as String;
    if (body is Map) {
      final m = body as Map;
      if (m['erro'] is String) return m['erro'] as String;
      if (m['status'] is String) return m['status'] as String;
      if (m['detail'] is String) return m['detail'] as String;
      if (m['detail'] is List) {
        return (m['detail'] as List)
            .map((e) => (e is Map ? e['msg'] : e)?.toString() ?? 'campo inválido')
            .join('; ');
      }
    }
    return 'HTTP $status';
  }

  @override
  String toString() => message;
}

class AxionApi {
  AxionApi(this.baseUrl);

  final String baseUrl; // ex.: http://10.0.2.2:8000
  String? token;

  Future<dynamic> request(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final headers = <String, String>{};
    if (body != null) headers['Content-Type'] = 'application/json';
    if (token != null) headers['Authorization'] = 'Bearer $token';

    final req = http.Request(method, uri)..headers.addAll(headers);
    if (body != null) req.body = jsonEncode(body);

    final streamed = await http.Client().send(req);
    final res = await http.Response.fromStream(streamed);
    final ct = res.headers['content-type'] ?? '';
    final data = ct.contains('application/json')
        ? jsonDecode(res.body)
        : res.body;

    if (res.statusCode >= 400) throw ApiException(res.statusCode, data);
    return data;
  }

  Future<void> login(String email, String senha) async {
    final r = await request('POST', '/auth/login',
        body: {'email': email, 'senha': senha});
    if (r is Map && r['status'] == 'Autenticado' && r['token'] != null) {
      token = r['token'] as String;
      return;
    }
    throw ApiException(401, r);
  }

  Future<Map<String, dynamic>> me() async =>
      Map<String, dynamic>.from(await request('GET', '/auth/me'));

  Future<List<dynamic>> fornecedores() async =>
      List<dynamic>.from(await request('GET', '/fornecedores/'));

  Future<List<dynamic>> estoque() async =>
      List<dynamic>.from(await request('GET', '/estoque/'));

  Future<List<dynamic>> dashboardAlertas() async =>
      List<dynamic>.from(await request('GET', '/alertas/'));

  // Demais métodos seguem o mesmo padrão do cliente TypeScript da seção 10.
}
```

**Observações específicas de mobile:**

- Guarde o token em `flutter_secure_storage`, nunca em texto plano.
- Ao receber `401` em `/auth/me`, limpe o token e volte ao login.
- `http` não segue `307` automaticamente em todos os casos: use a barra final.
- Não existe endpoint de refresh automático com expiração; `POST /auth/refresh` apenas troca o
  token. Se o app ficar muito tempo aberto, valide a sessão com `/auth/me` periodicamente.
- Flutter mobile/desktop não sofre CORS; **Flutter Web sofre**.
- Para exibir `/graficos/consumo`, use `Image.network` com o header `Authorization` (embora o
  endpoint não exija token).
- Evite chamar `/estoque/gerar_predicacao_compra` em telas de carregamento rápido; ele pode levar
  até ~60 s.

---

## 11. Checklist de implementação e teste

Antes de considerar o app integrado:

- [ ] Configurar base URL sem barra final e concatenar caminhos com barra.
- [ ] Implementar login, armazenamento do token e envio de `Authorization: Bearer`.
- [ ] Tratar `401` em `/auth/me` e `403` em `/usuarios/*`.
- [ ] Tratar respostas `text/plain` (`Ok`) e `application/json`.
- [ ] Normalizar `"None"` → `null`.
- [ ] Tratar `422` (array `detail`) e `400` (`{erro}`).
- [ ] Usar barra final em todas as coleções.
- [ ] Testar `GET /diagnosticos/status_banco` para checar conectividade.
- [ ] Implementar paginação/filtro local (a API não pagina).
- [ ] Não usar login demo em produção.
- [ ] Se for app web em outra origem, resolver CORS (proxy ou middleware no backend).
- [ ] Validar `tipo` de movimentação no cliente (`ENTRADA`/`SAIDA`).
- [ ] Exibir `/graficos/consumo` como imagem, não JSON.
- [ ] Timeout maior para `/estoque/gerar_predicacao_compra` e tratamento de `{"erro"}`.

### 11.1 Smoke test rápido

```bash
BASE=http://localhost:8000
curl -s "$BASE/diagnosticos/status_banco"
curl -s "$BASE/dashboard/"
curl -s "$BASE/estoque/"
curl -s "$BASE/fornecedores/" | head -c 200
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "$BASE/graficos/consumo"
curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"invalido","senha":"x"}' -w "\n%{http_code}\n"
```

---

## 12. Apêndice — amostras reais de resposta

### 12.1 `GET /fornecedores/`

```json
[
  {
    "id": 1,
    "razao_social": "Quimio Farma Distribuidora Ltda",
    "nome_fantasia": "Quimio Farma",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 3123-4000",
    "email": "vendas@quimiofarma.com.br",
    "prazo_entrega_dias": 3,
    "ativo": true
  }
]
```

### 12.2 `GET /materias-primas/` (trecho)

```json
[
  {
    "id": 1,
    "codigo": "MP-001",
    "nome": "Omeprazol",
    "unidade": "g",
    "estoque_minimo": 500.0,
    "estoque_maximo": 4000.0,
    "consumo_medio_mensal": 2200.0,
    "consumo_mensal": [
      { "mes": "2026-04", "consumo": 2050.0 },
      { "mes": "2026-05", "consumo": 2100.0 }
    ],
    "ativo": true
  }
]
```

### 12.3 `GET /compras/1`

```json
{
  "id": 1,
  "fornecedor_id": 1,
  "data_compra": "2026-06-01",
  "previsao_entrega": "2026-06-03",
  "data_recebimento": "2026-06-03",
  "status": "RECEBIDA",
  "itens": [
    { "id": 1, "materia_prima_id": 1, "quantidade": 2500.0, "valor_unitario": 0.95 }
  ]
}
```

### 12.4 `GET /formulas/1`

```json
{
  "id": 1,
  "codigo": "FML-001",
  "descricao": "Capsulas de Omeprazol 20mg",
  "categoria": "Gastroenterologia",
  "ativa": true,
  "itens": [
    { "id": 1, "materia_prima_id": 1, "quantidade": 20.0, "unidade": "mg/cap" }
  ]
}
```

### 12.5 `GET /pedidos/1`

```json
{
  "id": 1,
  "cliente_id": 1,
  "data_pedido": "2026-07-01 09:15:00",
  "status": "CONCLUIDO",
  "data_entrega": "2026-07-03",
  "itens": [
    { "id": 1, "formula_id": 1, "quantidade": 300 }
  ]
}
```

### 12.6 `GET /alertas/` (trecho)

```json
[
  {
    "id": 18,
    "tipo": "REPOSICAO",
    "materia_prima_id": null,
    "lote_id": null,
    "descricao": "Compra de acido hialuronico pendente aprovacao",
    "prioridade": "BAIXA",
    "resolvido": false,
    "data_alerta": "2026-08-09 10:00:00"
  }
]
```

### 12.7 `GET /previsoes/` (trecho)

```json
[
  {
    "id": 18,
    "materia_prima_id": 1,
    "data_previsao": "2026-09-01",
    "periodo_inicio": "2026-09-01",
    "periodo_fim": "2026-09-30",
    "consumo_previsto": 2380.0,
    "confianca": 90.0,
    "modelo_utilizado": "media_movel"
  }
]
```

### 12.8 `GET /estoque/movimentacoes` (trecho)

```json
[
  {
    "id": 29,
    "lote_id": 22,
    "tipo": "SAIDA",
    "quantidade": 32000.0,
    "data_movimento": "2026-08-01 08:00:00",
    "observacao": "Consumo producao"
  }
]
```

### 12.9 Falhas

```json
// 401 login
{ "status": "Nao autorizado", "token": null }

// 403 usuários
"Somente Administradores podem executar esta acao!"

// 404
"Registro nao encontrado!"

// 400 ação de negócio
{ "erro": "Saldo insuficiente no lote" }

// 422 validação
{ "detail": [{ "type": "missing", "loc": ["body", "razao_social"], "msg": "Field required", "input": {} }] }
```

---

## 13. Referência cruzada: telas da SPA → endpoints

| Tela (`web/app/js/pages`) | Endpoints principais |
|---|---|
| Dashboard | `/dashboard/`, `/dashboard/*`, `/estoque/` |
| Usuários | `/usuarios/*` |
| Fornecedores | `/fornecedores/*` |
| Matérias-primas | `/materias-primas/*` |
| Lotes | `/lotes/*` |
| Clientes | `/clientes/*` |
| Fórmulas | `/formulas/*`, `/formulas/{id}/itens` |
| Estoque | `/estoque/`, `/estoque/movimentacoes`, `/estoque/{id}` |
| Compras | `/compras/*`, `/compras/{id}/itens`, `/receber`, `/cancelar` |
| Pedidos | `/pedidos/*`, `/pedidos/{id}/itens` |
| Produção | `/ordens-producao/*`, `/iniciar`, `/finalizar`, `/cancelar`, `/consumos` |
| Consumo | `/consumos/` |
| Previsões | `/previsoes/*` |
| Sugestões | `/sugestoes-compra/*` |
| Alertas | `/alertas/`, `/alertas/{id}/resolver` |
| Relatórios | `/relatorios/*` |
| Configurações | `/auth/me`, preferências locais (localStorage) |

---

**Fim do relatório.**
