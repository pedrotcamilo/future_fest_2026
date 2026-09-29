from pathlib import Path
from sqlalchemy import select, text
from uuid import uuid4
from pwdlib import PasswordHash

from api.services.database_manager import get_session
from api.services.models import Usuarios

hash_senha = PasswordHash.recommended()
tokens_dict = {}

DEMO_USUARIO_ID = 5
SEED_PATH = Path(__file__).resolve().parent / "dependencies" / "seed_demo.sql"

def verificar_senha(email: str, senha: str):
    with get_session() as session:
        stmt = select(Usuarios).where(Usuarios.email == email)
        usuario = session.execute(stmt).scalars().first()

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
    with get_session() as session:
        stmt = select(Usuarios).where(Usuarios.email == email)
        usuario = session.execute(stmt).scalars().first()

        if usuario is None:
            return None

        return {
            "id": usuario.id,
            "nome": usuario.nome,
            "telefone": usuario.telefone,
            "email": usuario.email,
            "admin": usuario.admin
        }

def remover_token(email: str):
    if email in tokens_dict:
        del tokens_dict[email]

def email_por_token(token: str):
    for email, tk in list(tokens_dict.items()):
        if tk == token:
            return email
    return None

def token_do_header(authorization: str | None):
    """Extrai o token de um header "Authorization: Bearer <token>"."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[7:]

def buscar_usuario_por_token(token: str):
    email = email_por_token(token)
    if email is None:
        return None
    return buscar_usuario_por_email(email)

def executar_seed():
    if not SEED_PATH.exists():
        return

    sql = SEED_PATH.read_text(encoding="utf-8")

    try:
        with get_session() as session:
            session.execute(text(sql))
            session.commit()
    except Exception:
        pass

def executar_seed_usuario_demo(email: str):
    usuario = buscar_usuario_por_email(email)
    if usuario is None or usuario.get("id") != DEMO_USUARIO_ID:
        return

    executar_seed()
