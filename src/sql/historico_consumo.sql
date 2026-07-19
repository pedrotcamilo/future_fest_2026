CREATE TABLE historico_consumo (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    data DATE,
    quantidade NUMERIC(12,3)
);