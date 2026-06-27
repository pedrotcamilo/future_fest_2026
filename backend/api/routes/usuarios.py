from fastapi import APIRouter, responses
from api.services import database, respostas_padrao
from pydantic import BaseModel

router = APIRouter()

class BaseUsuarios(BaseModel):
    nome: str
    telefone: str
    email: str

class BaseCriacaoUsuario(BaseModel):
    nome: str
    telefone: str
    email: str
    senha: str

@router.get("/")
async def listar_usuarios():
    resultado = database.listar_usuarios()
    return responses.JSONResponse(
        content=resultado,
        status_code=200
    )

@router.get("/{id}")
async def listar_usuarios_id(id: int):
    if id is None:
        return respostas_padrao.campos_pendentes

    resultado = database.listar_usuario_id(id)
    return responses.JSONResponse(
        content=resultado,
        status_code=200
    )

@router.post("/")
async def criar_usuario(body: BaseCriacaoUsuario):

    if (
        body.nome is None
        or body.telefone is None
        or body.email is None
        or body.senha is None
    ):
        return respostas_padrao.campos_pendentes

    resultado = database.criar_usuario(
        nome = body.nome,
        telefone = body.telefone,
        email = body.email,
        senha = body.senha
    )

    return responses.PlainTextResponse(
        content=resultado,
        status_code=200
    )

@router.put("/{id}")
async def atualizar_usuario(id: int, body: BaseUsuarios):
    if id is None:
        return respostas_padrao.campos_pendentes

    resultado = database.editar_usuario(
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
async def deletar_usuario(id: int):
    if id is None:
        return respostas_padrao.campos_pendentes

    resultado = database.deletar_usuario(id)
    return responses.PlainTextResponse(
        content=resultado,
        status_code=200
    )