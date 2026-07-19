CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    fornecedor_id INTEGER
        REFERENCES fornecedores(id),
    data_compra DATE,
    previsao_entrega DATE,
    data_recebimento DATE,
    status VARCHAR(30)
);