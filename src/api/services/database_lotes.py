from sqlalchemy import select, update, delete
from sqlalchemy import insert
from datetime import date, timedelta

from api.services.database_manager import get_session
from api.services.models import Lotes

def listar_lotes(
    dias_vencimento: int = None,
    materia_prima: int = None,
    fornecedor: int = None
):
    with get_session() as session:
        stmt = select(Lotes)

        if materia_prima is not None:
            stmt = stmt.where(Lotes.materia_prima_id == materia_prima)
        if fornecedor is not None:
            stmt = stmt.where(Lotes.fornecedor_id == fornecedor)
        if dias_vencimento is not None:
            limite = date.today() + timedelta(days=dias_vencimento)
            stmt = stmt.where(Lotes.data_validade <= limite)

        result = session.execute(stmt)
        lotes = result.scalars().all()

        return [
            {
                "id": c.id,
                "materia_prima_id": c.materia_prima_id,
                "fornecedor_id": c.fornecedor_id,
                "numero_lote": c.numero_lote,
                "quantidade_inicial": c.quantidade_inicial,
                "quantidade_atual": c.quantidade_atual,
                "data_fabricacao": str(c.data_fabricacao),
                "data_validade": str(c.data_validade),
                "data_recebimento": str(c.data_recebimento),
                "valor_unitario": c.valor_unitario
            }
            for c in lotes
        ]

def listar_lote_id(id: int):
    with get_session() as session:
        stmt = select(Lotes).where(Lotes.id == id)
        result = session.execute(stmt)
        lote = result.scalar_one_or_none()

        if lote is None:
            return None

        return {
            "id": lote.id,
            "materia_prima_id": lote.materia_prima_id,
            "fornecedor_id": lote.fornecedor_id,
            "numero_lote": lote.numero_lote,
            "quantidade_inicial": lote.quantidade_inicial,
            "quantidade_atual": lote.quantidade_atual,
            "data_fabricacao": str(lote.data_fabricacao),
            "data_validade": str(lote.data_validade),
            "data_recebimento": str(lote.data_recebimento),
            "valor_unitario": lote.valor_unitario
        }

def criar_lote(
    materia_prima_id: int,
    fornecedor_id: int = None,
    numero_lote: str = None,
    quantidade_inicial: float = None,
    quantidade_atual: float = None,
    data_fabricacao: date = None,
    data_validade: date = None,
    data_recebimento: date = None,
    valor_unitario: float = None
):
    with get_session() as session:
        stmt = (
            insert(Lotes)
            .values(
                materia_prima_id=materia_prima_id,
                fornecedor_id=fornecedor_id,
                numero_lote=numero_lote,
                quantidade_inicial=quantidade_inicial,
                quantidade_atual=quantidade_atual or quantidade_inicial,
                data_fabricacao=data_fabricacao,
                data_validade=data_validade,
                data_recebimento=data_recebimento,
                valor_unitario=valor_unitario
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_lote(id: int, **kwargs):
    with get_session() as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(Lotes)
            .where(Lotes.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_lote(id: int):
    with get_session() as session:
        stmt = delete(Lotes).where(Lotes.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"
