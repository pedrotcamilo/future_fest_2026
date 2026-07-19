from fastapi import APIRouter, responses
from api.services import database_sugestoes

router = APIRouter()

@router.get("/")
async def listar_sugestoes():
    resultado = database_sugestoes.listar_sugestoes()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/gerar")
async def gerar_sugestoes():
    resultado = database_sugestoes.gerar_sugestoes()
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/aprovar")
async def aprovar_sugestao(id: int):
    resultado = database_sugestoes.aprovar_sugestao(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/rejeitar")
async def rejeitar_sugestao(id: int):
    resultado = database_sugestoes.rejeitar_sugestao(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)
