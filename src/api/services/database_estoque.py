from sqlalchemy import select, func
from datetime import datetime

from api.services.database_manager import get_session
from api.services.models import Lotes, MovimentacoesEstoque, MateriasPrimas

def consultar_estoque():
    with get_session() as session:
        r_mp = session.execute(select(MateriasPrimas))
        materias = {}
        for row in r_mp:
            materias[row.id] = row.nome

        r_lotes = session.execute(select(Lotes))
        estoque_map = {}
        for row in r_lotes:
            mp_id = row.materia_prima_id
            qtd = float(row.quantidade_atual) if row.quantidade_atual else 0
            estoque_map[mp_id] = estoque_map.get(mp_id, 0) + qtd

        data = []
        for mp_id, nome in materias.items():
            data.append({
                "materia_prima_id": mp_id,
                "nome": nome,
                "estoque": estoque_map.get(mp_id, 0)
            })

        return data

def consultar_estoque_materia_prima(materia_prima_id: int):
    with get_session() as session:
        stmt = (
            select(Lotes)
            .where(Lotes.materia_prima_id == materia_prima_id)
        )
        result = session.execute(stmt)
        lotes = result.scalars().all()

        return [
            {
                "id": l.id,
                "quantidade_atual": l.quantidade_atual
            }
            for l in lotes
        ]

def registrar_movimentacao(
    lote_id: int,
    tipo: str,
    quantidade: float,
    observacao: str = None
):
    from sqlalchemy import update

    with get_session() as session:
        dados = {
            "lote_id": lote_id,
            "tipo": tipo,
            "quantidade": quantidade,
            "data_movimento": datetime.now(),
            "observacao": observacao
        }

        if tipo == "SAIDA":
            stmt_lote = select(Lotes).where(Lotes.id == lote_id)
            lote = session.execute(stmt_lote).scalars().first()
            if lote is None:
                return "Lote nao encontrado"
            if lote.quantidade_atual < quantidade:
                return "Saldo insuficiente no lote"

            stmt_upd = (
                update(Lotes)
                .where(Lotes.id == lote_id)
                .values(
                    quantidade_atual=Lotes.quantidade_atual - quantidade
                )
            )
            session.execute(stmt_upd)

        elif tipo == "ENTRADA":
            stmt_upd = (
                update(Lotes)
                .where(Lotes.id == lote_id)
                .values(
                    quantidade_atual=Lotes.quantidade_atual + quantidade
                )
            )
            session.execute(stmt_upd)

        stmt_insert = (
            "INSERT INTO movimentacoes_estoque "
            "(lote_id, tipo, quantidade, data_movimento, observacao) "
            "VALUES (:lote_id, :tipo, :quantidade, :data_movimento, :observacao)"
        )
        session.execute(
            stmt_insert,
            dados
        )

        session.commit()
        return "Ok"

def listar_movimentacoes():
    with get_session() as session:
        stmt = select(MovimentacoesEstoque).order_by(
            MovimentacoesEstoque.data_movimento.desc()
        )
        result = session.execute(stmt)
        movs = result.scalars().all()

        return [
            {
                "id": m.id,
                "lote_id": m.lote_id,
                "tipo": m.tipo,
                "quantidade": m.quantidade,
                "data_movimento": str(m.data_movimento),
                "observacao": m.observacao
            }
            for m in movs
        ]
