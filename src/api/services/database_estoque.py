from sqlalchemy import select, update, insert, func
from datetime import datetime

from api.services.database_manager import get_session
from api.services.models import Lotes, MovimentacoesEstoque, MateriasPrimas

def consultar_estoque():
    with get_session() as session:
        r_mp = session.scalars(select(MateriasPrimas)).all()
        materias = {}
        for row in r_mp:
            materias[row.id] = row.nome

        r_lotes = session.scalars(select(Lotes)).all()
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
    if tipo not in ("ENTRADA", "SAIDA"):
        return "Tipo de movimentacao invalido"
    if quantidade is None or quantidade <= 0:
        return "Quantidade deve ser maior que zero"

    with get_session() as session:
        stmt_lote = select(Lotes).where(Lotes.id == lote_id)
        lote = session.execute(stmt_lote).scalars().first()
        if lote is None:
            return "Lote nao encontrado"

        if tipo == "SAIDA":
            if (lote.quantidade_atual or 0) < quantidade:
                return "Saldo insuficiente no lote"
            novo_saldo = Lotes.quantidade_atual - quantidade
        else:
            # COALESCE: lote cadastrado sem saldo (NULL) + entrada seguiria NULL.
            novo_saldo = func.coalesce(Lotes.quantidade_atual, 0) + quantidade

        stmt_upd = (
            update(Lotes)
            .where(Lotes.id == lote_id)
            .values(quantidade_atual=novo_saldo)
        )
        session.execute(stmt_upd)

        stmt_mov = insert(MovimentacoesEstoque).values(
            lote_id=lote_id,
            tipo=tipo,
            quantidade=quantidade,
            data_movimento=datetime.now(),
            observacao=observacao
        )
        session.execute(stmt_mov)

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
                "data_movimento": str(m.data_movimento) if m.data_movimento else None,
                "observacao": m.observacao
            }
            for m in movs
        ]
