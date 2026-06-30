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

#class Usuarios(Base):
#    __tablename__ = "usuarios"
#
#    id: Mapped[int] = mapped_column(primary_key=True)
#    nome: Mapped[str] = mapped_column()
#    telefone: Mapped[str] = mapped_column()
#    email: Mapped[str] = mapped_column()
#    admin: Mapped[bool] = mapped_column()
#    senha: Mapped[str] = mapped_column()