from fastapi import FastAPI, responses
from dotenv import load_dotenv
import re

import acoesUsuario

load_dotenv()

app = FastAPI()
regex_email = re.compile(r'^\S+@\S+\.\S+$')

@app.post("/registrarUsuario")
async def registar_usuario(email,nome,senha):

    if email == None or nome == None or senha == None:
        return responses.JSONResponse(
            content={"message": "Parametro ausente"},
            status_code=400
        )

    try:
        if acoesUsuario.usuarioExiste(email=email, id=None):
            return responses.JSONResponse(
                content={"message": "Conta ja existe"},
                status_code=400
            )   
        
        acoesUsuario.registar_usuario(email, nome, senha)

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
        if not acoesUsuario.usuarioExiste(id=id, email=None):
            return responses.JSONResponse(
                content={"message": "Usuario nao existe"},
                status_code=400
            )
        
        acoesUsuario.apagar_usuario(id)

        return responses.JSONResponse(
            content={"message": "Ok"},
            status_code=200
        )

    except Exception as e:
        return responses.JSONResponse(
            content={"message": str(e)},
            status_code=500
        )