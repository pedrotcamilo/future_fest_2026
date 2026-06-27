from fastapi import APIRouter, responses
from api.services import database, respostas_padrao
from pydantic import BaseModel

router = APIRouter()

class BaseClientes(BaseModel):
    nome: str
    telefone: str
    email: str

@router.get("/")
async def listar_clientes():
    resultado = database.listar_clientes()
    return responses.JSONResponse(
        content=resultado,
        status_code=200
    )

@router.get("/{id}")
async def listar_clientes_id(id: int):
    if id is None:
        return respostas_padrao.campos_pendentes

    resultado = database.listar_cliente_id(id)
    return responses.JSONResponse(
        content=resultado,
        status_code=200
    )

@router.put("/{id}")
async def atualizar_cliente(id: int, body: BaseClientes):
    if id is None:
        return respostas_padrao.campos_pendentes

    resultado = database.editar_cliente(
        id = id,
        nome = body.nome,
        telefone = body.telefone,
        email = body.email
    )

    return responses.PlainTextResponse(
        content=resultado,
        status_code=200
    )

@router.delete("/{id}")
async def deletar_cliente(id: int):
    if id is None:
        return respostas_padrao.campos_pendentes

    resultado = database.deletar_cliente(id)
    return responses.PlainTextResponse(
        content=resultado,
        status_code=200
    )