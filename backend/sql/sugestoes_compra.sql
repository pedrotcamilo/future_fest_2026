CREATE TABLE sugestoes_compra (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    data_sugestao DATE,
    quantidade_sugerida NUMERIC(12,3),
    motivo TEXT,
    status VARCHAR(20)
);