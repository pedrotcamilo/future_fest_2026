from sqlalchemy import select, update, delete
from sqlalchemy import insert

from api.services.database_manager import get_session
from api.services.models import Usuarios

def listar_usuarios():
    with get_session() as session:
        stmt = select(Usuarios)
        result = session.execute(stmt)

        usuarios = result.scalars().all()

        data = [
            {
                "id": c.id,
                "nome": c.nome,
                "telefone": c.telefone,
                "email": c.email,
                "admin": c.admin
            }
            for c in usuarios
        ]

        return data

def listar_usuario_id(id: int):
    with get_session() as session:
        stmt = select(Usuarios).where(Usuarios.id == id)
        result = session.execute(stmt)

        usuarios = result.scalars().all()

        data = [
            {
                "id": c.id,
                "nome": c.nome,
                "telefone": c.telefone,
                "email": c.email,
                "admin": c.admin
            }
            for c in usuarios
        ]

        return data

def criar_usuario(
    nome: str,
    telefone: str,
    email: str,
    senha: str = "SenhaPadrao"
):
    with get_session() as session:
        stmt = (
            insert(Usuarios)
            .values(
                nome=nome,
                telefone=telefone,
                email=email,
                admin=False,
                senha=senha
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_usuario(
    id: int,
    nome: str = None,
    telefone: str = None,
    email: str = None,
    senha: str = None,
    admin: bool = None
):
    with get_session() as session:
        valores = {}
        if nome is not None:
            valores["nome"] = nome
        if telefone is not None:
            valores["telefone"] = telefone
        if email is not None:
            valores["email"] = email
        if senha is not None:
            valores["senha"] = senha
        if admin is not None:
            valores["admin"] = admin

        stmt = (
            update(Usuarios)
            .where(Usuarios.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()

        return "Ok"

def deletar_usuario(id: int):
    with get_session() as session:
        stmt = (
            delete(Usuarios)
            .where(Usuarios.id == id)
            .where(Usuarios.admin == False)
        )

        session.execute(stmt)
        session.commit()

        return "Ok"
