CREATE VIEW vw_vencimentos AS

SELECT

    mp.nome,
    l.numero_lote,
    l.data_validade,
    l.quantidade_atual

FROM lotes l
JOIN materias_primas mp
ON mp.id = l.materia_prima_id
WHERE l.quantidade_atual > 0
ORDER BY l.data_validade;