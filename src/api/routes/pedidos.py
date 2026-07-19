from fastapi import APIRouter, responses
from pydantic import BaseModel
from datetime import date, datetime
from api.services import database_pedidos, respostas_padrao

router = APIRouter()

class BasePedido(BaseModel):
    cliente_id: int
    status: str = "PENDENTE"
    data_entrega: date | None = None

class ItemPedidoInput(BaseModel):
    formula_id: int
    quantidade: int

@router.get("/")
async def listar_pedidos():
    resultado = database_pedidos.listar_pedidos()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_pedido_id(id: int):
    resultado = database_pedidos.listar_pedido_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_pedido(body: BasePedido):
    pedido_id = database_pedidos.criar_pedido(
        cliente_id=body.cliente_id,
        status=body.status,
        data_entrega=body.data_entrega
    )
    return responses.JSONResponse(
        content={"id": pedido_id, "status": "Ok"}, status_code=200
    )

@router.put("/{id}")
async def atualizar_pedido(id: int, body: BasePedido):
    resultado = database_pedidos.editar_pedido(
        id=id,
        cliente_id=body.cliente_id,
        status=body.status,
        data_entrega=str(body.data_entrega) if body.data_entrega else None
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_pedido(id: int):
    resultado = database_pedidos.deletar_pedido(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.get("/{id}/itens")
async def listar_itens_pedido(id: int):
    resultado = database_pedidos.listar_itens_pedido(id)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/{id}/itens")
async def adicionar_item_pedido(id: int, body: ItemPedidoInput):
    resultado = database_pedidos.adicionar_item_pedido(
        pedido_id=id,
        formula_id=body.formula_id,
        quantidade=body.quantidade
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)
