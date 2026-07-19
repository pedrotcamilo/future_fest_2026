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