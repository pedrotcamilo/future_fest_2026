-- ============================================================
-- VIEWS da aplicacao (idempotente — pode ser executado quantas vezes
-- for necessario). O mesmo conjunto e criado na subida da API
-- (src/api/services/views.py).
-- Execute APOS a criacao das tabelas (src/sql/*.sql).
-- ============================================================

CREATE OR REPLACE VIEW vw_consumo_mensal AS
SELECT
    materia_prima_id,
    DATE_TRUNC('month', data) AS mes,
    SUM(quantidade) AS consumo
FROM historico_consumo
GROUP BY materia_prima_id, DATE_TRUNC('month', data);

CREATE OR REPLACE VIEW vw_estoque_atual AS
SELECT
    mp.id,
    mp.nome,
    SUM(l.quantidade_atual) AS estoque
FROM materias_primas mp
LEFT JOIN lotes l ON mp.id = l.materia_prima_id
GROUP BY mp.id, mp.nome;

CREATE OR REPLACE VIEW vw_vencimentos AS
SELECT
    mp.nome,
    l.numero_lote,
    l.data_validade,
    l.quantidade_atual
FROM lotes l
JOIN materias_primas mp ON mp.id = l.materia_prima_id
WHERE l.quantidade_atual > 0
ORDER BY l.data_validade;
