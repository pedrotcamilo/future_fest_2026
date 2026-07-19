CREATE TABLE sazonalidade (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER REFERENCES formulas(id),
    mes INTEGER,
    fator NUMERIC(5,2)
);