from sqlalchemy import select, update, delete
from sqlalchemy import insert
from sqlalchemy.orm import Session
from datetime import date, datetime

from api.services.database import engine
from api.services.models import Pedidos, PedidoItens

def listar_pedidos():
    with Session(engine) as session:
        stmt = select(Pedidos)
        result = session.execute(stmt)
        pedidos = result.scalars().all()

        return [
            {
                "id": p.id,
                "cliente_id": p.cliente_id,
                "data_pedido": str(p.data_pedido),
                "status": p.status,
                "data_entrega": str(p.data_entrega) if p.data_entrega else None
            }
            for p in pedidos
        ]

def listar_pedido_id(id: int):
    with Session(engine) as session:
        stmt = select(Pedidos).where(Pedidos.id == id)
        result = session.execute(stmt)
        pedido = result.scalar_one_or_none()

        if pedido is None:
            return None

        stmt_itens = select(PedidoItens).where(PedidoItens.pedido_id == id)
        itens = session.execute(stmt_itens).scalars().all()

        return {
            "id": pedido.id,
            "cliente_id": pedido.cliente_id,
            "data_pedido": str(pedido.data_pedido),
            "status": pedido.status,
            "data_entrega": str(pedido.data_entrega) if pedido.data_entrega else None,
            "itens": [
                {
                    "id": i.id,
                    "formula_id": i.formula_id,
                    "quantidade": i.quantidade
                }
                for i in itens
            ]
        }

def criar_pedido(
    cliente_id: int,
    data_pedido: datetime = None,
    status: str = "PENDENTE",
    data_entrega: date = None
):
    with Session(engine) as session:
        stmt = (
            insert(Pedidos)
            .values(
                cliente_id=cliente_id,
                data_pedido=data_pedido or datetime.now(),
                status=status,
                data_entrega=data_entrega
            )
            .returning(Pedidos.id)
        )

        result = session.execute(stmt)
        pedido_id = result.scalar_one()
        session.commit()
        return pedido_id

def editar_pedido(id: int, **kwargs):
    with Session(engine) as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(Pedidos)
            .where(Pedidos.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_pedido(id: int):
    with Session(engine) as session:
        stmt_itens = delete(PedidoItens).where(PedidoItens.pedido_id == id)
        session.execute(stmt_itens)

        stmt = delete(Pedidos).where(Pedidos.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"

def listar_itens_pedido(pedido_id: int):
    with Session(engine) as session:
        stmt = select(PedidoItens).where(PedidoItens.pedido_id == pedido_id)
        result = session.execute(stmt)
        itens = result.scalars().all()

        return [
            {
                "id": i.id,
                "formula_id": i.formula_id,
                "quantidade": i.quantidade
            }
            for i in itens
        ]

def adicionar_item_pedido(
    pedido_id: int,
    formula_id: int,
    quantidade: int
):
    with Session(engine) as session:
        stmt = (
            insert(PedidoItens)
            .values(
                pedido_id=pedido_id,
                formula_id=formula_id,
                quantidade=quantidade
            )
        )
        session.execute(stmt)
        session.commit()
        return "Ok"
