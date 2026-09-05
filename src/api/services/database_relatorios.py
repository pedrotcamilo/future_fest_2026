from sqlalchemy import select
from datetime import date

from api.services.database_manager import get_session
from api.services.models import HistoricoConsumo, MateriasPrimas, Lotes, Compras, OrdensProducao, PrevisoesConsumo

def relatorio_consumo(inicio: date = None, fim: date = None):
    with get_session() as session:
        stmt_hc = select(HistoricoConsumo)
        if inicio is not None:
            stmt_hc = stmt_hc.where(HistoricoConsumo.data >= inicio)
        if fim is not None:
            stmt_hc = stmt_hc.where(HistoricoConsumo.data <= fim)

        result_hc = session.execute(stmt_hc)
        historico = result_hc.scalars().all()

        result_mp = session.execute(select(MateriasPrimas))
        mp_map = {mp.id: mp for mp in result_mp.scalars().all()}

        consumo_por_mp = {}
        for h in historico:
            consumo_por_mp.setdefault(h.materia_prima_id, 0.0)
            consumo_por_mp[h.materia_prima_id] += float(h.quantidade)

        rows = []
        for mp_id, total in consumo_por_mp.items():
            mp = mp_map.get(mp_id)
            if mp:
                rows.append({
                    "materia_prima_id": mp_id,
                    "nome": mp.nome,
                    "unidade": mp.unidade,
                    "total_consumido": total
                })
        rows.sort(key=lambda r: r["nome"])
        return rows

def relatorio_estoque():
    with get_session() as session:
        result_mp = session.execute(select(MateriasPrimas))
        materias = result_mp.scalars().all()

        result_lotes = session.execute(select(Lotes))
        lotes = result_lotes.scalars().all()

        estoque_por_mp = {}
        for lote in lotes:
            estoque_por_mp.setdefault(lote.materia_prima_id, 0.0)
            estoque_por_mp[lote.materia_prima_id] += float(lote.quantidade_atual)

        return [
            {
                "materia_prima_id": mp.id,
                "nome": mp.nome,
                "unidade": mp.unidade,
                "estoque_atual": estoque_por_mp.get(mp.id, 0.0)
            }
            for mp in sorted(materias, key=lambda x: x.nome)
        ]

def relatorio_vencimentos():
    with get_session() as session:
        result_lotes = session.execute(
            select(Lotes).where(Lotes.quantidade_atual > 0)
        )
        lotes = result_lotes.scalars().all()

        result_mp = session.execute(select(MateriasPrimas))
        mp_map = {mp.id: mp for mp in result_mp.scalars().all()}

        rows = []
        for lote in lotes:
            mp = mp_map.get(lote.materia_prima_id)
            if mp:
                rows.append({
                    "nome": mp.nome,
                    "numero_lote": lote.numero_lote,
                    "data_validade": str(lote.data_validade),
                    "quantidade_atual": float(lote.quantidade_atual)
                })
        rows.sort(key=lambda r: r["data_validade"])
        return rows

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
        result_prev = session.execute(select(PrevisoesConsumo))
        previsoes = result_prev.scalars().all()

        result_mp = session.execute(select(MateriasPrimas))
        mp_map = {mp.id: mp for mp in result_mp.scalars().all()}

        rows = []
        for p in previsoes:
            mp = mp_map.get(p.materia_prima_id)
            rows.append({
                "materia_prima_id": p.materia_prima_id,
                "nome": mp.nome if mp else "",
                "periodo_inicio": str(p.periodo_inicio),
                "periodo_fim": str(p.periodo_fim),
                "consumo_previsto": float(p.consumo_previsto),
                "confianca": float(p.confianca) if p.confianca else None
            })
        rows.sort(key=lambda r: r["periodo_inicio"], reverse=True)
        return rows
