from sqlalchemy import select, update
from sqlalchemy import insert

from api.services.database_manager import get_session
from api.services.models import Alertas

def listar_alertas(
    tipo: str = None,
    prioridade: str = None,
    resolvido: bool = None
):
    with get_session() as session:
        stmt = select(Alertas)

        if tipo is not None:
            stmt = stmt.where(Alertas.tipo == tipo)
        if prioridade is not None:
            stmt = stmt.where(Alertas.prioridade == prioridade)
        if resolvido is not None:
            stmt = stmt.where(Alertas.resolvido == resolvido)

        stmt = stmt.order_by(Alertas.data_alerta.desc())

        result = session.execute(stmt)
        alertas = result.scalars().all()

        return [
            {
                "id": a.id,
                "tipo": a.tipo,
                "materia_prima_id": a.materia_prima_id,
                "lote_id": a.lote_id,
                "descricao": a.descricao,
                "prioridade": a.prioridade,
                "resolvido": a.resolvido,
                "data_alerta": str(a.data_alerta)
            }
            for a in alertas
        ]

def resolver_alerta(id: int):
    with get_session() as session:
        stmt = select(Alertas).where(Alertas.id == id)
        alerta = session.scalar(stmt)

        if alerta is None:
            return "Alerta nao encontrado"

        stmt_upd = (
            update(Alertas)
            .where(Alertas.id == id)
            .values(resolvido=True)
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"
