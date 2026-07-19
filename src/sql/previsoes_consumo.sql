CREATE TABLE previsoes_consumo (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER
        REFERENCES materias_primas(id),
    data_previsao DATE,
    periodo_inicio DATE,
    periodo_fim DATE,
    consumo_previsto NUMERIC(12,3),
    confianca NUMERIC(5,2),
    modelo_utilizado VARCHAR(100)
);