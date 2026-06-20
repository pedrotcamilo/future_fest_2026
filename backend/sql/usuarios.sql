CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(360),
    email VARCHAR(320) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    token_usuario VARCHAR(36)
);

INSERT INTO usuarios(nome, sobrenome, email, senha, telefone, token_usuario)
VALUES(
    "Admin",
    NULL,
    "admin@localhost",
    "Axionphare@@",
    NULL,
    NULL
)