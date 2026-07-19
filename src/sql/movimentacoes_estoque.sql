CREATE TABLE movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER REFERENCES lotes(id),
    tipo VARCHAR(20),
    quantidade NUMERIC(12,3),
    data_movimento TIMESTAMP DEFAULT NOW(),
    observacao TEXT
);