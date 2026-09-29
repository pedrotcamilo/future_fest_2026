from sqlalchemy import select
from datetime import date

from api.services.database_manager import get_session
from api.services.models import HistoricoConsumo

def listar_consumos(
    inicio: date = None,
    fim: date = None,
    materia_prima: int = None
):
    with get_session() as session:
        stmt = select(HistoricoConsumo)

        if materia_prima is not None:
            stmt = stmt.where(
                HistoricoConsumo.materia_prima_id == materia_prima
            )
        if inicio is not None:
            stmt = stmt.where(HistoricoConsumo.data >= inicio)
        if fim is not None:
            stmt = stmt.where(HistoricoConsumo.data <= fim)

        stmt = stmt.order_by(HistoricoConsumo.data.desc())

        result = session.execute(stmt)
        consumos = result.scalars().all()

        return [
            {
                "id": c.id,
                "materia_prima_id": c.materia_prima_id,
                "data": str(c.data),
                "quantidade": c.quantidade
            }
            for c in consumos
        ]
