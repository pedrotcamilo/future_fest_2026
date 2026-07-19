CREATE TABLE formula_itens (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER
        REFERENCES formulas(id),
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    quantidade NUMERIC(12,4),
    unidade VARCHAR(20)
);