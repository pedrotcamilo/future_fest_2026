from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from uuid import uuid4

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


# ---------------------------------------

def usuarioExiste(email,id):
    try:
        if not email == None: 
            db_cursor.execute("SELECT email FROM usuarios WHERE email = %s",(email,))
            row = db_cursor.fetchone()

        elif not id == None:
            db_cursor.execute("SELECT id FROM usuarios WHERE id = %s",(id,))
            row = db_cursor.fetchone()

        if row:
            return True
        else:
            return False
        
    except Exception as e:
        return str(e)

# ---------------------------------------

def registar_usuario(email,nome,senha):

    if email == None or nome == None or senha == None:
        return 1

    try:
        db_cursor.execute("INSERT INTO usuarios(nome,email,senha) VALUES (%s,%s,%s)",(nome,email,senha))
        db.commit()
        return 0

    except Exception as e:
        return str(e)

# ---------------------------------------

def apagar_usuario(id):
    
    if id == None:
        return 1
    
    try:
        db_cursor.execute("DELETE FROM usuarios WHERE ID = %s",(id,))
        db.commit()
        return 0
    
    except Exception as e:
        return str(e)
    
# ---------------------------------------

def logar_usuario(email, senha):

    if email == None or senha == None:
        return 2
    
    db_cursor.execute("SELECT id FROM usuarios WHERE email = %s AND senha = %s",(email,senha))
    row = db_cursor.fetchone()

    if row:
        return 0
    else:
        return 1
    
# ---------------------------------------

def info_usuario(id, email):

    if not id == None:
        db_cursor.execute("SELECT * FROM usuarios WHERE id = %s",(id,))

    if not email == None:
        db_cursor.execute("SELECT * FROM usuarios WHERE email = %s",(email,))

    row = db_cursor.fetchone()

    return row

# ---------------------------------------

def gerar_token_usuario(id):

    if id == None:
        return 2
    
    tokenGerado = str(uuid4())
    db_cursor.execute("UPDATE usuarios SET token_usuario = %s WHERE id = %s",(tokenGerado,id))
    db.commit()

    return tokenGerado

# ---------------------------------------

def reset_token_usuario(id):

    if id == None:
        return 2
    
    db_cursor.execute("UPDATE usuarios SET token_usuario = '' WHERE id = %s",(id,))
    db.commit()

    return 0

# ---------------------------------------

def tokenExiste(token):
    try:
        if not token == None: 
            db_cursor.execute("SELECT token_usuario FROM usuarios WHERE token_usuario = %s",(token,))
            row = db_cursor.fetchone()

        if row:
            return True
        else:
            return False
        
    except Exception as e:
        return str(e)
    
# ---------------------------------------