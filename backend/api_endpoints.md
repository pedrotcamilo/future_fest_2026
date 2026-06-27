# API REST - Sistema Inteligente para Farmácia de Manipulação

## Visão Geral

A API será responsável por gerenciar todos os módulos do sistema, incluindo:

- Autenticação
- Usuários
- Fornecedores
- Matérias-primas
- Estoque
- Compras
- Produção
- Fórmulas
- Pedidos
- IA (Previsão de Demanda)
- Dashboard
- Relatórios

---

# 1. Autenticação

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| POST | `/auth/login` | Realiza login |
| POST | `/auth/logout` | Encerra a sessão |
| POST | `/auth/refresh` | Renova o token JWT |
| GET | `/auth/me` | Retorna usuário autenticado |

---

# 2. Usuários

| Método | Endpoint |
|---------|----------|
| GET | `/usuarios` |
| GET | `/usuarios/{id}` |
| POST | `/usuarios` |
| PUT | `/usuarios/{id}` |
| DELETE | `/usuarios/{id}` |

---

# 3. Fornecedores

| Método | Endpoint |
|---------|----------|
| GET | `/fornecedores` |
| GET | `/fornecedores/{id}` |
| POST | `/fornecedores` |
| PUT | `/fornecedores/{id}` |
| DELETE | `/fornecedores/{id}` |

### Filtros

```http
GET /fornecedores?nome=
GET /fornecedores?ativo=true
```

---

# 4. Matérias-primas

| Método | Endpoint |
|---------|----------|
| GET | `/materias-primas` |
| GET | `/materias-primas/{id}` |
| POST | `/materias-primas` |
| PUT | `/materias-primas/{id}` |
| DELETE | `/materias-primas/{id}` |

### Consultas

```http
GET /materias-primas?nome=
GET /materias-primas?estoqueBaixo=true
GET /materias-primas?vencendo=true
```

---

# 5. Lotes

| Método | Endpoint |
|---------|----------|
| GET | `/lotes` |
| GET | `/lotes/{id}` |
| POST | `/lotes` |
| PUT | `/lotes/{id}` |
| DELETE | `/lotes/{id}` |

### Consultas

```http
GET /lotes?vencimento=30
GET /lotes?materiaPrima=15
GET /lotes?fornecedor=4
```

---

# 6. Estoque

## Consultar estoque

```http
GET /estoque
```

## Consultar estoque de uma matéria-prima

```http
GET /estoque/{materiaPrimaId}
```

## Registrar movimentação

```http
POST /estoque/movimentacoes
```

Exemplo:

```json
{
  "loteId": 12,
  "tipo": "SAIDA",
  "quantidade": 3.5,
  "observacao": "Produção OP-152"
}
```

## Histórico

```http
GET /estoque/movimentacoes
```

---

# 7. Compras

| Método | Endpoint |
|---------|----------|
| GET | `/compras` |
| GET | `/compras/{id}` |
| POST | `/compras` |
| PUT | `/compras/{id}` |
| DELETE | `/compras/{id}` |

## Receber compra

```http
POST /compras/{id}/receber
```

## Cancelar compra

```http
POST /compras/{id}/cancelar
```

---

# 8. Fórmulas

| Método | Endpoint |
|---------|----------|
| GET | `/formulas` |
| GET | `/formulas/{id}` |
| POST | `/formulas` |
| PUT | `/formulas/{id}` |
| DELETE | `/formulas/{id}` |

## Itens da fórmula

```http
GET    /formulas/{id}/itens
POST   /formulas/{id}/itens
PUT    /formulas/{id}/itens/{itemId}
DELETE /formulas/{id}/itens/{itemId}
```

---

# 9. Clientes

| Método | Endpoint |
|---------|----------|
| GET | `/clientes` |
| GET | `/clientes/{id}` |
| POST | `/clientes` |
| PUT | `/clientes/{id}` |
| DELETE | `/clientes/{id}` |

---

# 10. Pedidos

| Método | Endpoint |
|---------|----------|
| GET | `/pedidos` |
| GET | `/pedidos/{id}` |
| POST | `/pedidos` |
| PUT | `/pedidos/{id}` |
| DELETE | `/pedidos/{id}` |

## Itens do pedido

```http
GET  /pedidos/{id}/itens
POST /pedidos/{id}/itens
```

---

# 11. Produção

| Método | Endpoint |
|---------|----------|
| GET | `/ordens-producao` |
| GET | `/ordens-producao/{id}` |
| POST | `/ordens-producao` |
| PUT | `/ordens-producao/{id}` |
| DELETE | `/ordens-producao/{id}` |

## Ações

### Iniciar produção

```http
POST /ordens-producao/{id}/iniciar
```

### Finalizar produção

```http
POST /ordens-producao/{id}/finalizar
```

### Cancelar produção

```http
POST /ordens-producao/{id}/cancelar
```

### Registrar consumo

```http
POST /ordens-producao/{id}/consumos
```

---

# 12. Histórico de Consumo

Consultar histórico.

```http
GET /consumos
```

Filtros:

```http
GET /consumos?inicio=2026-01-01&fim=2026-03-01
GET /consumos?materiaPrima=8
```

---

# 13. IA - Previsão de Consumo

## Gerar previsão

```http
POST /previsoes/gerar
```

## Consultar previsões

```http
GET /previsoes
```

## Consultar previsão de uma matéria-prima

```http
GET /previsoes/materia-prima/{id}
```

---

# 14. Sugestões de Compra

Consultar sugestões.

```http
GET /sugestoes-compra
```

Gerar novas sugestões.

```http
POST /sugestoes-compra/gerar
```

Aprovar.

```http
POST /sugestoes-compra/{id}/aprovar
```

Rejeitar.

```http
POST /sugestoes-compra/{id}/rejeitar
```

---

# 15. Alertas

Consultar alertas.

```http
GET /alertas
```

Filtros.

```http
GET /alertas?tipo=VALIDADE
GET /alertas?prioridade=ALTA
GET /alertas?resolvido=false
```

Resolver alerta.

```http
POST /alertas/{id}/resolver
```

---

# 16. Dashboard

Resumo geral.

```http
GET /dashboard
```

Indicadores.

```http
GET /dashboard/estoque
GET /dashboard/compras
GET /dashboard/producao
GET /dashboard/previsoes
GET /dashboard/alertas
```

---

# 17. Relatórios

```http
GET /relatorios/consumo
GET /relatorios/estoque
GET /relatorios/vencimentos
GET /relatorios/compras
GET /relatorios/producao
GET /relatorios/previsoes
```

Filtros:

```http
GET /relatorios/consumo?inicio=2025-01-01&fim=2025-12-31
```

---

# Endpoints adicionais recomendados

## Histórico completo de uma matéria-prima

```http
GET /materias-primas/{id}/historico
```

Retorna:

- Consumo
- Compras
- Estoque
- Lotes
- Movimentações

---

## Previsão específica

```http
GET /materias-primas/{id}/previsao
```

---

## Receber compra

```http
POST /compras/{id}/receber
```

Esta operação deve:

- Criar lote(s)
- Registrar entrada no estoque
- Atualizar saldo
- Registrar movimentação

---

## Baixa automática na produção

```http
POST /ordens-producao/{id}/consumir
```

Responsável por:

- Consumir matérias-primas
- Priorizar lotes com vencimento mais próximo (FEFO)
- Atualizar estoque
- Registrar movimentação

---

## KPIs do Dashboard

```http
GET /dashboard/kpis
```

Exemplos de indicadores:

- Giro de estoque
- Cobertura em dias
- Consumo médio
- Taxa de desperdício
- Valor em estoque
- Assertividade das previsões

---

## IA

Treinar modelo.

```http
POST /ia/treinar
```

Executar previsão.

```http
POST /ia/prever
```

---

# Fluxo principal da aplicação

```text
Cliente
    │
    ▼
Pedido
    │
    ▼
Ordem de Produção
    │
    ▼
Consumo de Matérias-primas
    │
    ▼
Movimentação de Estoque
    │
    ▼
Histórico de Consumo
    │
    ▼
Modelo de IA
    │
    ├──► Previsão de consumo
    ├──► Sugestão de compras
    ├──► Alertas de falta
    └──► Alertas de vencimento
```

---

# Arquitetura sugerida

```text
Frontend
    │
    ▼
API REST
    │
    ├── Auth
    ├── Usuários
    ├── Clientes
    ├── Fornecedores
    ├── Compras
    ├── Estoque
    ├── Produção
    ├── Fórmulas
    ├── Dashboard
    ├── Relatórios
    └── IA
            │
            ▼
      Modelo de Machine Learning
            │
            ▼
        PostgreSQL
```

## Futuras melhorias

- Versionamento da API (`/api/v1`)
- Paginação e ordenação (`page`, `size`, `sort`)
- Filtros dinâmicos
- Upload de documentos fiscais (NF-e)
- Geração de relatórios em PDF e Excel
- Integração com ERP
- Notificações por e-mail ou WhatsApp
- WebSockets para atualização em tempo real do dashboard
- Documentação automática com OpenAPI/Swagger