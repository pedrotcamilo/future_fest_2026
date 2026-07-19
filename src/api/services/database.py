from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session
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
