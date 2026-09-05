from sqlalchemy import select, func
from datetime import date

from api.services.database_manager import get_session
from api.services.models import HistoricoConsumo, MateriasPrimas, Lotes, Compras, OrdensProducao, PrevisoesConsumo

def relatorio_consumo(inicio: date = None, fim: date = None):
    with get_session() as session:
        stmt = (
            select(
                HistoricoConsumo.materia_prima_id,
                MateriasPrimas.nome,
                MateriasPrimas.unidade,
                func.sum(HistoricoConsumo.quantidade)
            )
            .join(
                MateriasPrimas,
                HistoricoConsumo.materia_prima_id == MateriasPrimas.id
            )
        )

        if inicio is not None:
            stmt = stmt.where(HistoricoConsumo.data >= inicio)
        if fim is not None:
            stmt = stmt.where(HistoricoConsumo.data <= fim)

        stmt = stmt.group_by(
            HistoricoConsumo.materia_prima_id,
            MateriasPrimas.nome,
            MateriasPrimas.unidade
        ).order_by(MateriasPrimas.nome)

        result = session.execute(stmt)
        return [
            {
                "materia_prima_id": row[0],
                "nome": row[1],
                "unidade": row[2],
                "total_consumido": float(row[3])
            }
            for row in result
        ]

def relatorio_estoque():
    with get_session() as session:
        stmt = (
            select(
                MateriasPrimas.id,
                MateriasPrimas.nome,
                MateriasPrimas.unidade,
                func.coalesce(func.sum(Lotes.quantidade_atual), 0)
            )
            .outerjoin(Lotes, MateriasPrimas.id == Lotes.materia_prima_id)
            .group_by(MateriasPrimas.id, MateriasPrimas.nome, MateriasPrimas.unidade)
            .order_by(MateriasPrimas.nome)
        )

        result = session.execute(stmt)
        return [
            {
                "materia_prima_id": row[0],
                "nome": row[1],
                "unidade": row[2],
                "estoque_atual": float(row[3])
            }
            for row in result
        ]

def relatorio_vencimentos():
    with get_session() as session:
        stmt = (
            select(
                MateriasPrimas.nome,
                Lotes.numero_lote,
                Lotes.data_validade,
                Lotes.quantidade_atual
            )
            .join(MateriasPrimas, MateriasPrimas.id == Lotes.materia_prima_id)
            .where(Lotes.quantidade_atual > 0)
            .order_by(Lotes.data_validade)
        )

        result = session.execute(stmt)
        return [
            {
                "nome": row[0],
                "numero_lote": row[1],
                "data_validade": str(row[2]),
                "quantidade_atual": float(row[3])
            }
            for row in result
        ]

def relatorio_compras(inicio: date = None, fim: date = None):
    with get_session() as session:
        stmt = select(Compras)

        if inicio is not None:
            stmt = stmt.where(Compras.data_compra >= inicio)
        if fim is not None:
            stmt = stmt.where(Compras.data_compra <= fim)

        stmt = stmt.order_by(Compras.data_compra.desc())

        result = session.execute(stmt)
        compras = result.scalars().all()

        return [
            {
                "id": c.id,
                "fornecedor_id": c.fornecedor_id,
                "data_compra": str(c.data_compra),
                "status": c.status
            }
            for c in compras
        ]

def relatorio_producao(inicio: date = None, fim: date = None):
    with get_session() as session:
        stmt = select(OrdensProducao)

        if inicio is not None:
            stmt = stmt.where(OrdensProducao.data_inicio >= inicio)
        if fim is not None:
            stmt = stmt.where(OrdensProducao.data_inicio <= fim)

        stmt = stmt.order_by(OrdensProducao.data_inicio.desc())

        result = session.execute(stmt)
        ordens = result.scalars().all()

        return [
            {
                "id": o.id,
                "pedido_id": o.pedido_id,
                "data_inicio": str(o.data_inicio) if o.data_inicio else None,
                "data_fim": str(o.data_fim) if o.data_fim else None,
                "status": o.status
            }
            for o in ordens
        ]

def relatorio_previsoes():
    with get_session() as session:
        stmt = (
            select(
                PrevisoesConsumo.materia_prima_id,
                MateriasPrimas.nome,
                PrevisoesConsumo.periodo_inicio,
                PrevisoesConsumo.periodo_fim,
                PrevisoesConsumo.consumo_previsto,
                PrevisoesConsumo.confianca
            )
            .join(
                MateriasPrimas,
                PrevisoesConsumo.materia_prima_id == MateriasPrimas.id
            )
            .order_by(PrevisoesConsumo.periodo_inicio.desc())
        )

        result = session.execute(stmt)
        return [
            {
                "materia_prima_id": row[0],
                "nome": row[1],
                "periodo_inicio": str(row[2]),
                "periodo_fim": str(row[3]),
                "consumo_previsto": float(row[4]),
                "confianca": float(row[5]) if row[5] else None
            }
            for row in result
        ]
