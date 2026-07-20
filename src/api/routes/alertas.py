from fastapi import APIRouter, responses, Query
from api.services import database_alertas

router = APIRouter()

@router.get("/")
async def listar_alertas(
    tipo: str = Query(None),
    prioridade: str = Query(None),
    resolvido: bool = Query(None)
):
    resultado = database_alertas.listar_alertas(tipo, prioridade, resolvido)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/{id}/resolver")
async def resolver_alerta(id: int):
    resultado = database_alertas.resolver_alerta(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)
