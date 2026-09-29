from fastapi import APIRouter, responses, Header
from api.services import database_usuarios, database_auth, respostas_padrao
from pydantic import BaseModel
from pwdlib import PasswordHash

router = APIRouter()
hash_senha = PasswordHash.recommended()

def eh_admin(authorization: str | None):
    token = database_auth.token_do_header(authorization)
    usuario = database_auth.buscar_usuario_por_token(token) if token else None
    return bool(usuario and usuario.get("admin"))

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
    resultado = database_usuarios.listar_usuarios()
    return responses.JSONResponse(
        content=resultado,
        status_code=200
    )

@router.get("/{id}")
async def listar_usuarios_id(id: int):
    resultado = database_usuarios.listar_usuario_id(id)
    return responses.JSONResponse(
        content=resultado,
        status_code=200
    )

@router.post("/")
async def criar_usuario(body: BaseCriacaoUsuario, authorization: str = Header(None)):
    if not eh_admin(authorization):
        return respostas_padrao.somente_admin

    hashed = hash_senha.hash(body.senha)

    resultado = database_usuarios.criar_usuario(
        nome = body.nome,
        telefone = body.telefone,
        email = body.email,
        senha = hashed
    )

    return responses.PlainTextResponse(
        content=resultado,
        status_code=200
    )

@router.put("/{id}")
async def atualizar_usuario(id: int, body: BaseUsuarios, authorization: str = Header(None)):
    if not eh_admin(authorization):
        return respostas_padrao.somente_admin

    resultado = database_usuarios.editar_usuario(
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
async def deletar_usuario(id: int, authorization: str = Header(None)):
    if not eh_admin(authorization):
        return respostas_padrao.somente_admin

    resultado = database_usuarios.deletar_usuario(id)
    return responses.PlainTextResponse(
        content=resultado,
        status_code=200
    )