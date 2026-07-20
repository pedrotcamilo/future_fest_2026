CREATE VIEW vw_consumo_mensal AS

SELECT

    materia_prima_id,
    DATE_TRUNC('month', data) mes,
    SUM(quantidade) consumo

FROM historico_consumo

GROUP BY materia_prima_id,
DATE_TRUNC('month', data);