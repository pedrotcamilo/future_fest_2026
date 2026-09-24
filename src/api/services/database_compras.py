from sqlalchemy import select, update, delete
from sqlalchemy import insert
from datetime import date

from api.services.database_manager import get_session
from api.services.models import Compras, CompraItens, Lotes

def listar_compras():
    with get_session() as session:
        stmt = select(Compras)
        result = session.execute(stmt)
        compras = result.scalars().all()

        return [
            {
                "id": c.id,
                "fornecedor_id": c.fornecedor_id,
                "data_compra": str(c.data_compra),
                "previsao_entrega": str(c.previsao_entrega),
                "data_recebimento": str(c.data_recebimento) if c.data_recebimento else None,
                "status": c.status
            }
            for c in compras
        ]

def listar_compra_id(id: int):
    with get_session() as session:
        stmt = select(Compras).where(Compras.id == id)
        result = session.execute(stmt)
        compra = result.scalar_one_or_none()

        if compra is None:
            return None

        stmt_itens = select(CompraItens).where(CompraItens.compra_id == id)
        itens = session.execute(stmt_itens).scalars().all()

        return {
            "id": compra.id,
            "fornecedor_id": compra.fornecedor_id,
            "data_compra": str(compra.data_compra),
            "previsao_entrega": str(compra.previsao_entrega),
            "data_recebimento": str(compra.data_recebimento) if compra.data_recebimento else None,
            "status": compra.status,
            "itens": [
                {
                    "id": i.id,
                    "materia_prima_id": i.materia_prima_id,
                    "quantidade": i.quantidade,
                    "valor_unitario": i.valor_unitario
                }
                for i in itens
            ]
        }

def criar_compra(
    fornecedor_id: int,
    data_compra: date = None,
    previsao_entrega: date = None,
    status: str = "PENDENTE"
):
    with get_session() as session:
        stmt = (
            insert(Compras)
            .values(
                fornecedor_id=fornecedor_id,
                data_compra=data_compra or date.today(),
                previsao_entrega=previsao_entrega,
                status=status
            )
            .returning(Compras.id)
        )

        result = session.execute(stmt)
        compra_id = result.scalar_one()
        session.commit()
        return compra_id

def editar_compra(id: int, **kwargs):
    with get_session() as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(Compras)
            .where(Compras.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_compra(id: int):
    with get_session() as session:
        stmt_itens = delete(CompraItens).where(CompraItens.compra_id == id)
        session.execute(stmt_itens)

        stmt = delete(Compras).where(Compras.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"

def receber_compra(id: int):
    with get_session() as session:
        stmt = select(Compras).where(Compras.id == id)
        compra = session.execute(stmt).scalars().first()

        if compra is None:
            return "Compra nao encontrada"

        if compra.status == "RECEBIDA":
            return "Compra ja recebida"

        stmt_itens = select(CompraItens).where(CompraItens.compra_id == id)
        itens = session.execute(stmt_itens).scalars().all()

        for item in itens:
            stmt_lote = (
                insert(Lotes)
                .values(
                    materia_prima_id=item.materia_prima_id,
                    fornecedor_id=compra.fornecedor_id,
                    numero_lote=f"COMPRA-{id}-{item.id}",
                    quantidade_inicial=item.quantidade,
                    quantidade_atual=item.quantidade,
                    data_recebimento=date.today(),
                    valor_unitario=item.valor_unitario
                )
            )
            session.execute(stmt_lote)

            stmt_mov = (
                "INSERT INTO movimentacoes_estoque "
                "(lote_id, tipo, quantidade, data_movimento, observacao) "
                "VALUES (currval('lotes_id_seq'), 'ENTRADA', :qtd, NOW(), :obs)"
            )
            session.execute(
                stmt_mov,
                {"qtd": item.quantidade, "obs": f"Recebimento da compra #{id}"}
            )

        stmt_upd = (
            update(Compras)
            .where(Compras.id == id)
            .values(
                status="RECEBIDA",
                data_recebimento=date.today()
            )
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"

def cancelar_compra(id: int):
    with get_session() as session:
        stmt = select(Compras).where(Compras.id == id)
        compra = session.execute(stmt).scalars().first()

        if compra is None:
            return "Compra nao encontrada"

        stmt_upd = (
            update(Compras)
            .where(Compras.id == id)
            .values(status="CANCELADA")
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"

def adicionar_item_compra(
    compra_id: int,
    materia_prima_id: int,
    quantidade: float,
    valor_unitario: float = None
):
    with get_session() as session:
        stmt = (
            insert(CompraItens)
            .values(
                compra_id=compra_id,
                materia_prima_id=materia_prima_id,
                quantidade=quantidade,
                valor_unitario=valor_unitario
            )
        )
        session.execute(stmt)
        session.commit()
        return "Ok"
