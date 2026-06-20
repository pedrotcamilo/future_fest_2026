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


def adicionar_receita(id_medicamento, id_usuario, confianca_extracao_ia, dosagem, frequencia, horarios, dias_semana, duracao_dias, data_fim, qnt, via_administracao, uso_continuo, observacoes):
    try:
        query = """
            INSERT INTO receitas (id_medicamento, id_usuario, confianca_extracao_ia, dosagem, frequencia, horarios, dias_semana, duracao_dias, data_fim, qnt, via_administracao, uso_continuo, observacoes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        db_cursor.execute(query, (id_medicamento, id_usuario, confianca_extracao_ia, dosagem, frequencia, horarios, dias_semana, duracao_dias, data_fim, qnt, via_administracao, uso_continuo, observacoes))
        db.commit()

        return "Ok"
    except Exception as e:
        print(f"Erro ao adicionar receita: {e}")
        db.rollback()
        return str(e)

def listar_receitas_usuario(id):
    row = None

    if id is None:
        return 2

    try:
        db_cursor.execute("SELECT * FROM receitas_medicas WHERE id_usuario = %s", (id,))
        row = db_cursor.fetchone()

        if row:
            return row
        else:
            return None

    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)