CREATE TABLE ordens_producao (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id),
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    status VARCHAR(30)
);