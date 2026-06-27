from sqlalchemy import create_engine, select, update, delete
from sqlalchemy.orm import Session, DeclarativeBase, Mapped, mapped_column
from os import getenv
from dotenv import load_dotenv

load_dotenv(verbose=True)

usuario = getenv("DB_USUARIO")
senha = getenv("DB_SENHA")
host = getenv("DB_HOST")
porta = getenv("DB_PORT")
database = getenv("DB_SCHEM")

engine = create_engine(
    f"postgresql://{usuario}:{senha}@{host}:{porta}/{database}"
)

class Base(DeclarativeBase):
    pass

class Clientes(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    telefone: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column()

def listar_clientes():
    with Session(engine) as session:
        stmt = select(Clientes)
        result = session.execute(stmt)

        clientes = result.scalars().all()

        data = [
            {
                "id": c.id,
                "nome": c.nome,
                "telefone": c.telefone,
                "email": c.email
            }
            for c in clientes
        ]

        return data

def listar_cliente_id(id: int):
    with Session(engine) as session:
        stmt = select(Clientes).where(Clientes.id == id)
        result = session.execute(stmt)

        clientes = result.scalars().all()

        data = [
            {
                "id": c.id,
                "nome": c.nome,
                "telefone": c.telefone,
                "email": c.email
            }
            for c in clientes
        ]

        return data

def editar_cliente(
    id: int,
    nome = None,
    telefone = None,
    email = None
):
    with Session(engine) as session:
        stmt = (
            update(Clientes)
            .where(Clientes.id == id)
            .values(
                nome = nome,
                telefone = telefone,
                email = email
            )
        )

        session.execute(stmt)
        session.commit()

        return "Ok"

def deletar_cliente(id: int):
    with Session(engine) as session:
        stmt = (
            delete(Clientes)
            .where(Clientes.id == id)
        )

        session.execute(stmt)
        session.commit()

        return "Ok"