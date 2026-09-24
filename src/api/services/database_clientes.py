from sqlalchemy import select, update, delete
from sqlalchemy import insert

from api.services.database_manager import get_session
from api.services.models import Clientes

def listar_clientes():
    with get_session() as session:
        stmt = select(Clientes)
        result = session.execute(stmt)
        clientes = result.scalars().all()

        return [
            {
                "id": c.id,
                "nome": c.nome,
                "telefone": c.telefone,
                "email": c.email
            }
            for c in clientes
        ]

def listar_cliente_id(id: int):
    with get_session() as session:
        stmt = select(Clientes).where(Clientes.id == id)
        result = session.execute(stmt)
        cliente = result.scalar_one_or_none()

        if cliente is None:
            return None

        return {
            "id": cliente.id,
            "nome": cliente.nome,
            "telefone": cliente.telefone,
            "email": cliente.email
        }

def criar_cliente(
    nome: str,
    telefone: str = None,
    email: str = None
):
    with get_session() as session:
        stmt = (
            insert(Clientes)
            .values(
                nome=nome,
                telefone=telefone,
                email=email
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_cliente(id: int, **kwargs):
    with get_session() as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(Clientes)
            .where(Clientes.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_cliente(id: int):
    with get_session() as session:
        stmt = delete(Clientes).where(Clientes.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"
