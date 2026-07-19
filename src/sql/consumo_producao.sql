CREATE TABLE consumo_producao (
    id SERIAL PRIMARY KEY,
    ordem_producao_id INTEGER
        REFERENCES ordens_producao(id),
    lote_id INTEGER
        REFERENCES lotes(id),
    quantidade NUMERIC(12,3)
);