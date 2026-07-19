from fastapi import APIRouter, responses, Query
from pydantic import BaseModel
from datetime import date
from api.services import database_previsoes

router = APIRouter()

class PrevisaoInput(BaseModel):
    materia_prima_id: int
    periodo_inicio: date
    periodo_fim: date
    consumo_previsto: float
    confianca: float | None = None
    modelo_utilizado: str = "MEDIA_MOVEL"

@router.post("/gerar")
async def gerar_previsao(body: PrevisaoInput):
    resultado = database_previsoes.gerar_previsao(
        materia_prima_id=body.materia_prima_id,
        periodo_inicio=body.periodo_inicio,
        periodo_fim=body.periodo_fim,
        consumo_previsto=body.consumo_previsto,
        confianca=body.confianca,
        modelo_utilizado=body.modelo_utilizado
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.get("/")
async def listar_previsoes():
    resultado = database_previsoes.listar_previsoes()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/materia-prima/{id}")
async def listar_previsoes_materia_prima(id: int):
    resultado = database_previsoes.listar_previsoes_por_materia_prima(id)
    return responses.JSONResponse(content=resultado, status_code=200)
