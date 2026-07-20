CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    fornecedor_id INTEGER
        REFERENCES fornecedores(id),
    numero_lote VARCHAR(80),
    quantidade_inicial NUMERIC(12,3),
    quantidade_atual NUMERIC(12,3),
    data_fabricacao DATE,
    data_validade DATE,
    data_recebimento DATE,
    valor_unitario NUMERIC(12,4)
);