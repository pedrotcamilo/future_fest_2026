from fastapi import FastAPI, responses
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
import psycopg2
import os
import re

load_dotenv()

app = FastAPI()
regex_email = re.compile(r'^\S+@\S+\.\S+$')

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

@app.post("/registrarUsuario")
async def registar_usuario(email,nome,senha):

    if email == None or nome == None or senha == None:
        return responses.JSONResponse(
            content={"message": "Parametro ausente"},
            status_code=400
        )

    try:
        db_cursor.execute("SELECT id FROM usuarios WHERE email = %s",(email,))
        row = db_cursor.fetchone()

        if row:
            return responses.JSONResponse(
                content={"message":"Usuario ja existe"},
                status_code=400
            )

        if not bool(re.match(regex_email, email)):
            return responses.JSONResponse(
                content={"message":"Email invalido"},
                status_code=400
            )

        db_cursor.execute("INSERT INTO usuarios(nome,email,senha) VALUES (%s,%s,%s)",(nome,email,senha))
        db.commit()
        return responses.JSONResponse(
            content={"message": "Ok"},
            status_code=200
        )

    except Exception as e:
        return responses.JSONResponse(
            content={"message": str(e)},
            status_code=500
        )
    
@app.post("/apagarUsuario")
async def apagar_usuario(id):

    if id == None:
        return responses.JSONResponse(
            content={"message": "ID Ausente"},
            status_code=400
        )

    try:
        db_cursor.execute("SELECT id FROM usuarios WHERE id = %s",(id,))
        row = db_cursor.fetchone()

        if not row:
            return responses.JSONResponse(
                content={"message":"Usuario nao existe"},
                status_code=400
            )
        
        db_cursor.execute("DELETE FROM usuarios WHERE ID = %s",(id,))
        db.commit()
        return responses.JSONResponse(
            content={"message": "Ok"},
            status_code=200
        )

    except Exception as e:
        return responses.JSONResponse(
            content={"message": str(e)},
            status_code=500
        )