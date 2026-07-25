-- === TABELAS SEM DEPENDENCIAS ===

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200),
    telefone VARCHAR(30),
    email VARCHAR(150)
);

CREATE TABLE materias_primas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    unidade VARCHAR(20),
    estoque_minimo NUMERIC(12,3),
    estoque_maximo NUMERIC(12,3),
    consumo_medio_mensal NUMERIC(12,3),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj VARCHAR(20),
    telefone VARCHAR(30),
    email VARCHAR(150),
    prazo_entrega_dias INTEGER,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE formulas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30),
    descricao VARCHAR(300),
    categoria VARCHAR(100),
    ativa BOOLEAN DEFAULT TRUE
);

-- === TABELAS COM FK DE 1º NIVEL ===

CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    fornecedor_id INTEGER
        REFERENCES fornecedores(id),
    numero_lote VARCHAR(80),
    quantidade_inicial NUMERIC(12,3),
    quantidade_atual NUMERIC(12,3),
    data_fabricacao DATE,
    data_validade DATE,
    data_recebimento DATE,
    valor_unitario NUMERIC(12,4)
);

CREATE TABLE formula_itens (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER
        REFERENCES formulas(id),
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    quantidade NUMERIC(12,4),
    unidade VARCHAR(20)
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    data_pedido TIMESTAMP,
    status VARCHAR(30),
    data_entrega DATE
);

CREATE TABLE historico_consumo (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    data DATE,
    quantidade NUMERIC(12,3)
);

CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    fornecedor_id INTEGER
        REFERENCES fornecedores(id),
    data_compra DATE,
    previsao_entrega DATE,
    data_recebimento DATE,
    status VARCHAR(30)
);

CREATE TABLE sazonalidade (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER REFERENCES formulas(id),
    mes INTEGER,
    fator NUMERIC(5,2)
);

CREATE TABLE sugestoes_compra (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    data_sugestao DATE,
    quantidade_sugerida NUMERIC(12,3),
    motivo TEXT,
    status VARCHAR(20)
);

CREATE TABLE previsoes_consumo (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    data_previsao DATE,
    periodo_inicio DATE,
    periodo_fim DATE,
    consumo_previsto NUMERIC(12,3),
    confianca NUMERIC(5,2),
    modelo_utilizado VARCHAR(100)
);

-- === TABELAS COM FK DE 2º NIVEL ===

CREATE TABLE pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id),
    formula_id INTEGER REFERENCES formulas(id),
    quantidade INTEGER
);

CREATE TABLE compra_itens (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id),
    materia_prima_id INTEGER REFERENCES materias_primas(id),
    quantidade NUMERIC(12,3),
    valor_unitario NUMERIC(12,2)
);

CREATE TABLE ordens_producao (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id),
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    status VARCHAR(30)
);

CREATE TABLE movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER REFERENCES lotes(id),
    tipo VARCHAR(20),
    quantidade NUMERIC(12,3),
    data_movimento TIMESTAMP DEFAULT NOW(),
    observacao TEXT
);

-- === TABELAS COM FK DE 3º NIVEL ===

CREATE TABLE consumo_producao (
    id SERIAL PRIMARY KEY,
    ordem_producao_id INTEGER
        REFERENCES ordens_producao(id),
    lote_id INTEGER
        REFERENCES lotes(id),
    quantidade NUMERIC(12,3)
);

CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50),
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    lote_id INTEGER
        REFERENCES lotes(id),
    descricao TEXT,
    prioridade VARCHAR(20),
    resolvido BOOLEAN DEFAULT FALSE,
    data_alerta TIMESTAMP DEFAULT NOW()
);

-- === VIEWS ===

CREATE VIEW vw_estoque_atual AS
SELECT
    mp.id,
    mp.nome,
    SUM(l.quantidade_atual) estoque
FROM materias_primas mp
LEFT JOIN lotes l
ON mp.id = l.materia_prima_id
GROUP BY mp.id, mp.nome;

CREATE VIEW vw_consumo_mensal AS
SELECT
    materia_prima_id,
    DATE_TRUNC('month', data) mes,
    SUM(quantidade) consumo
FROM historico_consumo
GROUP BY materia_prima_id,
DATE_TRUNC('month', data);

CREATE VIEW vw_vencimentos AS
SELECT
    mp.nome,
    l.numero_lote,
    l.data_validade,
    l.quantidade_atual
FROM lotes l
JOIN materias_primas mp
ON mp.id = l.materia_prima_id
WHERE l.quantidade_atual > 0
ORDER BY l.data_validade;

-- === INDICES ===

CREATE INDEX idx_lotes_validade
ON lotes(data_validade);

CREATE INDEX idx_lotes_mp
ON lotes(materia_prima_id);

CREATE INDEX idx_consumo_data
ON historico_consumo(data);

CREATE INDEX idx_movimentacao_data
ON movimentacoes_estoque(data_movimento);

CREATE INDEX idx_previsao_periodo
ON previsoes_consumo(periodo_inicio);

CREATE INDEX idx_ordem_status
ON ordens_producao(status);

CREATE INDEX idx_pedido_data
ON pedidos(data_pedido);
