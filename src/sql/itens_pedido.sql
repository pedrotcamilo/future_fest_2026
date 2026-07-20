CREATE TABLE pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id),
    formula_id INTEGER REFERENCES formulas(id),
    quantidade INTEGER
);