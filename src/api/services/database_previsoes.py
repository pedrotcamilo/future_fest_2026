from sqlalchemy import select, text
from sqlalchemy import insert, delete
from datetime import date
import calendar

from api.services.database_manager import get_session
from api.services.models import PrevisoesConsumo

def listar_previsoes():
    with get_session() as session:
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
    with get_session() as session:
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
    with get_session() as session:
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

def gerar_previsao_automatica(periodo_inicio: date = None, periodo_fim: date = None):
    hoje = date.today()
    if periodo_inicio is None:
        periodo_inicio = hoje.replace(day=1)

    if periodo_fim is None:
        ultimo_dia = calendar.monthrange(hoje.year, hoje.month)[1]
        periodo_fim = hoje.replace(day=ultimo_dia)

    with get_session() as session:
        stmt_media = text("""
            SELECT
                vc.materia_prima_id,
                ROUND(AVG(vc.consumo), 3) AS media_movel
            FROM vw_consumo_mensal vc
            WHERE vc.mes >= date_trunc('month', CURRENT_DATE) - INTERVAL '6 months'
              AND vc.mes <  date_trunc('month', CURRENT_DATE)
            GROUP BY vc.materia_prima_id
        """)
        result = session.execute(stmt_media)
        medias = result.fetchall()

        if not medias:
            return "Nenhum consumo historico encontrado"

        geradas = 0
        for mp_id, media in medias:
            if media is None or float(media) <= 0:
                continue

            stmt_delete = delete(PrevisoesConsumo).where(
                PrevisoesConsumo.materia_prima_id == mp_id,
                PrevisoesConsumo.periodo_inicio >= periodo_inicio
            )
            session.execute(stmt_delete)

            stmt_insert = insert(PrevisoesConsumo).values(
                materia_prima_id=mp_id,
                data_previsao=date.today(),
                periodo_inicio=periodo_inicio,
                periodo_fim=periodo_fim,
                consumo_previsto=float(media),
                confianca=90.0,
                modelo_utilizado="MEDIA_MOVEL"
            )
            session.execute(stmt_insert)
            geradas += 1

        session.commit()
        return f"Ok - {geradas} previao(oes) gerada(s)"
