CREATE TABLE compra_itens (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id),
    materia_prima_id INTEGER REFERENCES materias_primas(id),
    quantidade NUMERIC(12,3),
    valor_unitario NUMERIC(12,2)
);