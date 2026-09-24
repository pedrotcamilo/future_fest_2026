from sqlalchemy import select, update, delete
from sqlalchemy import insert
from datetime import datetime

from api.services.database_manager import get_session
from api.services.models import OrdensProducao, ConsumoProducao, Lotes

def listar_ordens():
    with get_session() as session:
        stmt = select(OrdensProducao)
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

def listar_ordem_id(id: int):
    with get_session() as session:
        stmt = select(OrdensProducao).where(OrdensProducao.id == id)
        result = session.execute(stmt)
        ordem = result.scalar_one_or_none()

        if ordem is None:
            return None

        return {
            "id": ordem.id,
            "pedido_id": ordem.pedido_id,
            "data_inicio": str(ordem.data_inicio) if ordem.data_inicio else None,
            "data_fim": str(ordem.data_fim) if ordem.data_fim else None,
            "status": ordem.status
        }

def criar_ordem(
    pedido_id: int = None,
    status: str = "PENDENTE"
):
    with get_session() as session:
        stmt = (
            insert(OrdensProducao)
            .values(
                pedido_id=pedido_id,
                status=status
            )
            .returning(OrdensProducao.id)
        )

        result = session.execute(stmt)
        ordem_id = result.scalar_one()
        session.commit()
        return ordem_id

def editar_ordem(id: int, **kwargs):
    with get_session() as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(OrdensProducao)
            .where(OrdensProducao.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_ordem(id: int):
    with get_session() as session:
        stmt_consumo = delete(ConsumoProducao).where(
            ConsumoProducao.ordem_producao_id == id
        )
        session.execute(stmt_consumo)

        stmt = delete(OrdensProducao).where(OrdensProducao.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"

def iniciar_ordem(id: int):
    with get_session() as session:
        stmt = select(OrdensProducao).where(OrdensProducao.id == id)
        ordem = session.execute(stmt).scalars().first()

        if ordem is None:
            return "Ordem nao encontrada"

        stmt_upd = (
            update(OrdensProducao)
            .where(OrdensProducao.id == id)
            .values(
                status="EM_PRODUCAO",
                data_inicio=datetime.now()
            )
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"

def finalizar_ordem(id: int):
    with get_session() as session:
        stmt = select(OrdensProducao).where(OrdensProducao.id == id)
        ordem = session.execute(stmt).scalars().first()

        if ordem is None:
            return "Ordem nao encontrada"

        stmt_upd = (
            update(OrdensProducao)
            .where(OrdensProducao.id == id)
            .values(
                status="FINALIZADA",
                data_fim=datetime.now()
            )
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"

def cancelar_ordem(id: int):
    with get_session() as session:
        stmt = select(OrdensProducao).where(OrdensProducao.id == id)
        ordem = session.execute(stmt).scalars().first()

        if ordem is None:
            return "Ordem nao encontrada"

        stmt_upd = (
            update(OrdensProducao)
            .where(OrdensProducao.id == id)
            .values(status="CANCELADA")
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"

def registrar_consumo(
    ordem_producao_id: int,
    lote_id: int,
    quantidade: float
):
    with get_session() as session:
        stmt_lote = select(Lotes).where(Lotes.id == lote_id)
        lote = session.execute(stmt_lote).scalars().first()

        if lote is None:
            return "Lote nao encontrado"

        if lote.quantidade_atual < quantidade:
            return "Saldo insuficiente no lote"

        stmt_consumo = (
            insert(ConsumoProducao)
            .values(
                ordem_producao_id=ordem_producao_id,
                lote_id=lote_id,
                quantidade=quantidade
            )
        )
        session.execute(stmt_consumo)

        stmt_upd_lote = (
            update(Lotes)
            .where(Lotes.id == lote_id)
            .values(quantidade_atual=Lotes.quantidade_atual - quantidade)
        )
        session.execute(stmt_upd_lote)

        stmt_mov = (
            "INSERT INTO movimentacoes_estoque "
            "(lote_id, tipo, quantidade, data_movimento, observacao) "
            "VALUES (:lote_id, 'SAIDA', :qtd, NOW(), :obs)"
        )
        session.execute(
            stmt_mov,
            {
                "lote_id": lote_id,
                "qtd": quantidade,
                "obs": f"Consumo na ordem de producao #{ordem_producao_id}"
            }
        )

        session.commit()
        return "Ok"


