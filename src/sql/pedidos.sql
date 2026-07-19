CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    data_pedido TIMESTAMP,
    status VARCHAR(30),
    data_entrega DATE
);