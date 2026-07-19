from fastapi import APIRouter, responses
from pydantic import BaseModel
from datetime import date
from api.services import database_compras, respostas_padrao

router = APIRouter()

class BaseCompra(BaseModel):
    fornecedor_id: int
    data_compra: date | None = None
    previsao_entrega: date | None = None
    status: str = "PENDENTE"

class ItemCompraInput(BaseModel):
    materia_prima_id: int
    quantidade: float
    valor_unitario: float | None = None

@router.get("/")
async def listar_compras():
    resultado = database_compras.listar_compras()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_compra_id(id: int):
    resultado = database_compras.listar_compra_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_compra(body: BaseCompra):
    compra_id = database_compras.criar_compra(
        fornecedor_id=body.fornecedor_id,
        data_compra=body.data_compra,
        previsao_entrega=body.previsao_entrega,
        status=body.status
    )
    return responses.JSONResponse(
        content={"id": compra_id, "status": "Ok"}, status_code=200
    )

@router.put("/{id}")
async def atualizar_compra(id: int, body: BaseCompra):
    resultado = database_compras.editar_compra(
        id=id,
        fornecedor_id=body.fornecedor_id,
        data_compra=str(body.data_compra) if body.data_compra else None,
        previsao_entrega=str(body.previsao_entrega) if body.previsao_entrega else None,
        status=body.status
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_compra(id: int):
    resultado = database_compras.deletar_compra(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/receber")
async def receber_compra(id: int):
    resultado = database_compras.receber_compra(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/cancelar")
async def cancelar_compra(id: int):
    resultado = database_compras.cancelar_compra(id)
    if resultado != "Ok":
        return responses.JSONResponse(
            content={"erro": resultado}, status_code=400
        )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.post("/{id}/itens")
async def adicionar_item_compra(id: int, body: ItemCompraInput):
    resultado = database_compras.adicionar_item_compra(
        compra_id=id,
        materia_prima_id=body.materia_prima_id,
        quantidade=body.quantidade,
        valor_unitario=body.valor_unitario
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)
