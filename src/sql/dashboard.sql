CREATE VIEW vw_estoque_atual AS

SELECT
    mp.id,
    mp.nome,
    SUM(l.quantidade_atual) estoque

FROM materias_primas mp

LEFT JOIN lotes l
ON mp.id = l.materia_prima_id

GROUP BY mp.id, mp.nome;