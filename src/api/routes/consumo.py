from fastapi import APIRouter, responses, Query
from datetime import date
from api.services import database_consumo

router = APIRouter()

@router.get("/")
async def listar_consumos(
    inicio: date = Query(None),
    fim: date = Query(None),
    materia_prima: int = Query(None, alias="materiaPrima")
):
    resultado = database_consumo.listar_consumos(inicio, fim, materia_prima)
    return responses.JSONResponse(content=resultado, status_code=200)
