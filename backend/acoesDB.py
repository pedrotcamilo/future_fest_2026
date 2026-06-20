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