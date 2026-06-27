from sqlalchemy import create_engine, select, update, delete
from sqlalchemy.dialects.mysql import insert
from sqlalchemy.orm import Session, DeclarativeBase, Mapped, mapped_column
from os import getenv
from dotenv import load_dotenv

load_dotenv(verbose=True)

usuario = getenv("DB_USUARIO")
db_senha = getenv("DB_SENHA")
host = getenv("DB_HOST")
porta = getenv("DB_PORT")
database = getenv("DB_SCHEM")

engine = create_engine(
    f"postgresql://{usuario}:{db_senha}@{host}:{porta}/{database}"
)

class Base(DeclarativeBase):
    pass

class Usuarios(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    telefone: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column()
    admin: Mapped[bool] = mapped_column()
    senha: Mapped[str] = mapped_column()

def listar_usuarios():
    with Session(engine) as session:
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
    with Session(engine) as session:
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
    senha = "SenhaPadrao"
):
    with Session(engine) as session:
        stmt = (
            insert(Usuarios)
            .values(
                nome = nome,
                telefone = telefone,
                email = email,
                admin = False,
                senha = senha
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_usuario(
    id: int,
    nome = None,
    telefone = None,
    email = None,
    senha = "SenhaPadrao",
    admin = False
):
    with Session(engine) as session:
        stmt = (
            update(Usuarios)
            .where(Usuarios.id == id)
            .values(
                nome = nome,
                telefone = telefone,
                email = email,
                admin = admin,
                senha = senha
            )
        )

        session.execute(stmt)
        session.commit()

        return "Ok"

def deletar_usuario(id: int):
    with Session(engine) as session:
        stmt = (
            delete(Usuarios)
            .where(Usuarios.id == id)
            .where(Usuarios.admin == False)
        )

        session.execute(stmt)
        session.commit()

        return "Ok"