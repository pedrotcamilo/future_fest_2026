from fastapi import APIRouter, responses
from pydantic import BaseModel
from api.services import database_estoque

router = APIRouter()

class MovimentacaoEntrada(BaseModel):
    loteId: int
    tipo: str
    quantidade: float
    observacao: str | None = None

@router.get("/")
async def consultar_estoque():
    resultado = database_estoque.consultar_estoque()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{materia_prima_id}")
async def consultar_estoque_materia_prima(materia_prima_id: int):
    resultado = database_estoque.consultar_estoque_materia_prima(
        materia_prima_id
    )
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/movimentacoes")
async def registrar_movimentacao(body: MovimentacaoEntrada):
    resultado = database_estoque.registrar_movimentacao(
        lote_id=body.loteId,
        tipo=body.tipo,
        quantidade=body.quantidade,
        observacao=body.observacao
    )
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.get("/movimentacoes")
async def listar_movimentacoes():
    resultado = database_estoque.listar_movimentacoes()
    return responses.JSONResponse(content=resultado, status_code=200)
