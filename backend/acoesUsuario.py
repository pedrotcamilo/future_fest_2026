from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from uuid import uuid4

import psycopg2
import os
import random

load_dotenv()

codigosReset = {}

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

# Usuario

def usuarioExiste(email,id):
    row = None

    try:
        if not email is None:
            db_cursor.execute("SELECT email FROM usuarios WHERE email = %s",(email,))
            row = db_cursor.fetchone()

        elif not id is None:
            db_cursor.execute("SELECT id FROM usuarios WHERE id = %s",(id,))
            row = db_cursor.fetchone()

        if row:
            return True
        else:
            return False
        
    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)

def registar_usuario(email,nome,senha):

    if email is None or nome is None or senha is None:
        return 1

    try:
        db_cursor.execute("INSERT INTO usuarios(nome,email,senha) VALUES (%s,%s,%s)",(nome,email,senha))
        db.commit()
        return 0

    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)

def apagar_usuario(id):
    
    if id is None:
        return 1
    
    try:
        db_cursor.execute("DELETE FROM usuarios WHERE ID = %s",(id,))
        db.commit()
        return 0
    
    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)

def logar_usuario(email, senha):

    if email is None or senha is None:
        return 2
    
    db_cursor.execute("SELECT id FROM usuarios WHERE email = %s AND senha = %s",(email,senha))
    row = db_cursor.fetchone()

    if row:
        return 0
    else:
        return 1

def logar_usuario_token(token):

    if token is None:
        return 2
    
    db_cursor.execute("SELECT * FROM usuarios WHERE token_usuario = %s",(token,))
    row = db_cursor.fetchone()

    if row:
        return row
    else:
        return 1

def info_usuario(id, email):

    if not id is None:
        db_cursor.execute("SELECT * FROM usuarios WHERE id = %s",(id,))

    if not email is None:
        db_cursor.execute("SELECT * FROM usuarios WHERE email = %s",(email,))

    row = db_cursor.fetchone()

    return row

def listar_usuarios():

    usuarios = []
    db_cursor.execute("SELECT id, nome, email FROM usuarios")
    data = db_cursor.fetchall()

    for row in data:
        usuarios.append(row)

    return usuarios

# Token

def gerar_token_usuario(id):

    if id is None:
        return 2
    
    tokenGerado = str(uuid4())
    db_cursor.execute("UPDATE usuarios SET token_usuario = %s WHERE id = %s",(tokenGerado,id))
    db.commit()

    return tokenGerado

def reset_token_usuario(id):

    if id is None:
        return 2
    
    db_cursor.execute("UPDATE usuarios SET token_usuario = '' WHERE id = %s",(id,))
    db.commit()

    return 0

def token_existe(token):
    row = None

    try:
        if not token is None:
            db_cursor.execute("SELECT token_usuario FROM usuarios WHERE token_usuario = %s",(token,))
            row = db_cursor.fetchone()

        if row:
            return True
        else:
            return False
        
    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)

def token_correto(id, token):
    row = None

    try:
        if not token is None:
            db_cursor.execute("SELECT token_usuario FROM usuarios WHERE token_usuario = %s AND id = %s", (token,id))
            row = db_cursor.fetchone()

        if row:
            return True
        else:
            return False

    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)
    
# Atualizar Senha

def solicitar_reset_senha(email):
    codAleatorio = ""

    if email is None:
        return 2

    for i in range(0,6):
        n = random.randint(0,9)
        codAleatorio += str(n)

    codigosReset[email] = codAleatorio
    return 0

def atualizar_senha(email, codReset, senha_nova):
    
    if email is None or codReset is None or senha_nova is None:
        return 2
    
    try:
        codigoCorreto = False
        for key, value in codigosReset.items():
            if key == email:
                if value == codReset:
                    codigoCorreto = True
        
        if not codigoCorreto:
            return 3

        db_cursor.execute("UPDATE usuarios SET senha = %s WHERE email = %s", (senha_nova,email))
        db.commit()

        codigosReset[email] = ""
        codigosReset.pop(email)
        return 0
    
    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
        return str(e)
    
def listar_codigos_reset():
    return codigosReset