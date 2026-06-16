from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

import psycopg2
import os

load_dotenv()

try:
    db = psycopg2.connect(
        dbname = os.environ.get("DB_NAME"),
        user = os.environ.get("DB_USER"),
        password = os.environ.get("DB_PASSWORD"),
        host = os.environ.get("DB_HOST")
    )

    db_cursor = db.cursor(cursor_factory=RealDictCursor)

except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")


def recriar_db():
    print("Ferramenta de recriação de banco de dados...")

    db_cursor.execute('CREATE TABLE usuarios(id SERIAL PRIMARY KEY, nome VARCHAR(100), email VARCHAR(320), senha VARCHAR(255) NOT NULL, token_usuario VARCHAR(36))')
    db.commit()
    print("Tabela de usuarios recriada")

    db_cursor.execute('INSERT INTO usuarios VALUES("Admin", "admin@local", "AxionAdmin@", "0")')
    db.commit()
    print("Usuario Administrador adicionado")

    db_cursor.execute('INSERT INTO usuarios VALUES("Teste da Silva", "teste.silva@email.com", "UsuarioDeTeste@", "")')
    db.commit()
    print("Usuario de Teste adicionado")