from fastapi import APIRouter, responses
from pydantic import BaseModel
from api.services import database_producao, respostas_padrao

router = APIRouter()

class BaseOrdem(BaseModel):
    pedido_id: int | None = None
    status: str = "PENDENTE"

class ConsumoInput(BaseModel):
    lote_id: int
    quantidade: float

@router.get("/")
async def listar_ordens():
    resultado = database_producao.listar_ordens()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_ordem_id(id: int):
    resultado = database_producao.listar_ordem_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_ordem(body: BaseOrdem):
    ordem_id = database_producao.criar_ordem(
        pedido_id=body.pedido_id,
        status=body.status
    )
    return responses.JSONResponse(
        content={"id": ordem_id, "status": "Ok"}, status_code=200
    )

@router.put("/{id}")
async def atualizar_ordem(id: int, body: BaseOrdem):
    resultado = database_producao.editar_ordem(
        id=id,
        pedido_id=body.pedido_id,
        status=body.status
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_ordem(id: int):
    resultado = database_producao.deletar_ordem(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/iniciar")
async def iniciar_ordem(id: int):
    resultado = database_producao.iniciar_ordem(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/finalizar")
async def finalizar_ordem(id: int):
    resultado = database_producao.finalizar_ordem(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/cancelar")
async def cancelar_ordem(id: int):
    resultado = database_producao.cancelar_ordem(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/consumos")
async def registrar_consumo(id: int, body: ConsumoInput):
    resultado = database_producao.registrar_consumo(
        ordem_producao_id=id,
        lote_id=body.lote_id,
        quantidade=body.quantidade
    )
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)
