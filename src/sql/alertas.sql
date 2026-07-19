CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50),
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    lote_id INTEGER
        REFERENCES lotes(id),
    descricao TEXT,
    prioridade VARCHAR(20),
    resolvido BOOLEAN DEFAULT FALSE,
    data_alerta TIMESTAMP DEFAULT NOW()
);