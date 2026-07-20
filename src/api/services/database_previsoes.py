from sqlalchemy import select
from sqlalchemy import insert
from sqlalchemy.orm import Session
from datetime import date

from api.services.database import engine
from api.services.models import PrevisoesConsumo

def listar_previsoes():
    with Session(engine) as session:
        stmt = select(PrevisoesConsumo).order_by(
            PrevisoesConsumo.data_previsao.desc()
        )
        result = session.execute(stmt)
        previsoes = result.scalars().all()

        return [
            {
                "id": p.id,
                "materia_prima_id": p.materia_prima_id,
                "data_previsao": str(p.data_previsao),
                "periodo_inicio": str(p.periodo_inicio),
                "periodo_fim": str(p.periodo_fim),
                "consumo_previsto": p.consumo_previsto,
                "confianca": p.confianca,
                "modelo_utilizado": p.modelo_utilizado
            }
            for p in previsoes
        ]

def listar_previsoes_por_materia_prima(materia_prima_id: int):
    with Session(engine) as session:
        stmt = (
            select(PrevisoesConsumo)
            .where(PrevisoesConsumo.materia_prima_id == materia_prima_id)
            .order_by(PrevisoesConsumo.data_previsao.desc())
        )
        result = session.execute(stmt)
        previsoes = result.scalars().all()

        return [
            {
                "id": p.id,
                "data_previsao": str(p.data_previsao),
                "periodo_inicio": str(p.periodo_inicio),
                "periodo_fim": str(p.periodo_fim),
                "consumo_previsto": p.consumo_previsto,
                "confianca": p.confianca,
                "modelo_utilizado": p.modelo_utilizado
            }
            for p in previsoes
        ]

def gerar_previsao(
    materia_prima_id: int,
    periodo_inicio: date,
    periodo_fim: date,
    consumo_previsto: float,
    confianca: float = None,
    modelo_utilizado: str = "MEDIA_MOVEL"
):
    with Session(engine) as session:
        stmt = (
            insert(PrevisoesConsumo)
            .values(
                materia_prima_id=materia_prima_id,
                data_previsao=date.today(),
                periodo_inicio=periodo_inicio,
                periodo_fim=periodo_fim,
                consumo_previsto=consumo_previsto,
                confianca=confianca,
                modelo_utilizado=modelo_utilizado
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"
