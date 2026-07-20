from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import uuid4
from pwdlib import PasswordHash

from api.services.database import engine
from api.services.models import Usuarios

hash_senha = PasswordHash.recommended()
tokens_dict = {}

def verificar_senha(email: str, senha: str):
    with Session(engine) as session:
        stmt = select(Usuarios).where(Usuarios.email == email)
        usuario = session.scalar(stmt)

        if usuario is None:
            return False

        hash_db = usuario.senha
        status = hash_senha.verify(senha, hash_db)

        return status

def gerar_token(email: str):
    novo_token = str(uuid4())

    tokens_dict[email] = novo_token

    return novo_token

def buscar_usuario_por_email(email: str):
    with Session(engine) as session:
        stmt = select(Usuarios).where(Usuarios.email == email)
        usuario = session.scalar(stmt)

        if usuario is None:
            return None

        return {
            "id": usuario.id,
            "nome": usuario.nome,
            "telefone": usuario.telefone,
            "email": usuario.email,
            "admin": usuario.admin
        }

def obter_tokens():
    return tokens_dict

def remover_token(email: str):
    if email in tokens_dict:
        del tokens_dict[email]
