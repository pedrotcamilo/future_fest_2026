"""Garantia das views usadas pela aplicacao (idempotente).

O docker/init.sql contem APENAS o seed (nao cria tabelas nem views — o
schema vem dos scripts em src/sql/ executados manualmente). Para nenhum
ambiente ficar sem as views, elas sao (re)criadas na subida da API com
CREATE OR REPLACE VIEW. Falhas sao apenas registradas em log para nao
impedir a inicializacao (ex.: banco indisponivel no boot).
"""

import logging

from sqlalchemy import text

from api.services.database_manager import get_primary_engine

logger = logging.getLogger(__name__)

VIEWS = [
    # Consumo mensal por materia-prima (usado por /materias-primas e
    # /previsoes/gerar-automatica).
    """
    CREATE OR REPLACE VIEW vw_consumo_mensal AS
    SELECT
        materia_prima_id,
        DATE_TRUNC('month', data) AS mes,
        SUM(quantidade) AS consumo
    FROM historico_consumo
    GROUP BY materia_prima_id, DATE_TRUNC('month', data)
    """,
    # Estoque atual consolidado por materia-prima.
    """
    CREATE OR REPLACE VIEW vw_estoque_atual AS
    SELECT
        mp.id,
        mp.nome,
        SUM(l.quantidade_atual) AS estoque
    FROM materias_primas mp
    LEFT JOIN lotes l ON mp.id = l.materia_prima_id
    GROUP BY mp.id, mp.nome
    """,
    # Lotes com saldo, ordenados por validade.
    """
    CREATE OR REPLACE VIEW vw_vencimentos AS
    SELECT
        mp.nome,
        l.numero_lote,
        l.data_validade,
        l.quantidade_atual
    FROM lotes l
    JOIN materias_primas mp ON mp.id = l.materia_prima_id
    WHERE l.quantidade_atual > 0
    ORDER BY l.data_validade
    """,
]


def criar_views():
    """Cria/atualiza as views no banco primario. Nunca lanca excecao."""
    try:
        engine = get_primary_engine()
        with engine.begin() as conn:
            for sql in VIEWS:
                conn.execute(text(sql))
        logger.info("Views (vw_consumo_mensal, vw_estoque_atual, "
                    "vw_vencimentos) garantidas no banco primario")
    except Exception as e:  # noqa: BLE001 - indisponibilidade nao pode derrubar o boot
        logger.warning("Nao foi possivel garantir as views: %s", e)
