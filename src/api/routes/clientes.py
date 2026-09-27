from fastapi import APIRouter, responses
from pydantic import BaseModel
from api.services import database_clientes, respostas_padrao

router = APIRouter()

class BaseCliente(BaseModel):
    nome: str
    telefone: str | None = None
    email: str | None = None
    # CNPJ (14) e CPF (11) compartilham a mesma coluna no banco.
    cnpj: str | None = None

@router.get("/")
async def listar_clientes():
    resultado = database_clientes.listar_clientes()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_cliente_id(id: int):
    resultado = database_clientes.listar_cliente_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_cliente(body: BaseCliente):
    resultado = database_clientes.criar_cliente(
        nome=body.nome,
        telefone=body.telefone,
        email=body.email,
        cnpj=body.cnpj
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.put("/{id}")
async def atualizar_cliente(id: int, body: BaseCliente):
    resultado = database_clientes.editar_cliente(
        id=id,
        nome=body.nome,
        telefone=body.telefone,
        email=body.email,
        cnpj=body.cnpj
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_cliente(id: int):
    resultado = database_clientes.deletar_cliente(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)
