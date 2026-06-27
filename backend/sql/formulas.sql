CREATE TABLE formulas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30),
    descricao VARCHAR(300),
    categoria VARCHAR(100),
    ativa BOOLEAN DEFAULT TRUE
);