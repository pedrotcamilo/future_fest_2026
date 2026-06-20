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

def adicionar_medicamento(nome, principio_ativo, laboratorio, concentracao, forma_farmaceutica, via_administracao, registro_anvisa, descricao):
    try:
        query = """
            INSERT INTO medicamentos (nome, principio_ativo, laboratorio, concentracao, forma_farmaceutica, via_administracao, registro_anvisa, descricao)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        db_cursor.execute(query, (nome, principio_ativo, laboratorio, concentracao, forma_farmaceutica, via_administracao, registro_anvisa, descricao))
        db.commit()

        return 0
    except Exception as e:
        print(f"Erro ao adicionar medicamento: {e}")
        db.rollback()

def buscar_medicamento_id(id):

    if id is None:
        return None

    row = None

    try:
        db_cursor.execute("SELECT * FROM medicamentos WHERE id = %s", (id,))
        row = db_cursor.fetchone()

        if row:
            return row
        else:
            return None

    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)