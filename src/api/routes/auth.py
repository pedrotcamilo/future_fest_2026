from fastapi import APIRouter, responses, Header
from pydantic import BaseModel
from api.services import database_auth, respostas_padrao

router = APIRouter()

class PromptLogin(BaseModel):
    email: str
    senha: str

@router.post("/login")
async def realizar_login(body: PromptLogin):
    status_senha = database_auth.verificar_senha(body.email, body.senha)

    if status_senha:
        token = database_auth.gerar_token(body.email)

        return responses.JSONResponse(
            content={
                "status": "Autenticado",
                "token": token
            },
            status_code=200
        )

    return responses.JSONResponse(
        content={
            "status": "Nao autorizado",
            "token": None
        },
        status_code=401
    )

@router.post("/logout")
async def realizar_logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        tokens = database_auth.obter_tokens()
        for email, tok in list(tokens.items()):
            if tok == token:
                database_auth.remover_token(email)
                break

    return responses.JSONResponse(
        content={"status": "Sessao encerrada"},
        status_code=200
    )

@router.post("/refresh")
async def refresh_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return responses.JSONResponse(
            content={"status": "Token nao informado"},
            status_code=401
        )

    token = authorization[7:]
    tokens = database_auth.obter_tokens()
    email = None
    for em, tk in tokens.items():
        if tk == token:
            email = em
            break

    if email is None:
        return responses.JSONResponse(
            content={"status": "Token invalido"},
            status_code=401
        )

    novo_token = database_auth.gerar_token(email)
    return responses.JSONResponse(
        content={"token": novo_token},
        status_code=200
    )

@router.get("/me")
async def usuario_atual(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return responses.JSONResponse(
            content={"status": "Nao autorizado"},
            status_code=401
        )

    token = authorization[7:]
    tokens = database_auth.obter_tokens()
    email = None
    for em, tk in tokens.items():
        if tk == token:
            email = em
            break

    if email is None:
        return responses.JSONResponse(
            content={"status": "Nao autorizado"},
            status_code=401
        )

    usuario = database_auth.buscar_usuario_por_email(email)
    if usuario is None:
        return respostas_padrao.nao_encontrado

    return responses.JSONResponse(content=usuario, status_code=200)
