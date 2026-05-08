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
    
@app.post("/logarUsuario")
async def logar_usuario(email, senha):

    if email == None or senha == None:
        return responses.JSONResponse(
            content={
                "autenticado": "false",
                "motivo": "Campos nao preenchidos",
                "nome": ""
            },
            status_code=400
        )
    
    statusLogin = acoesUsuario.logar_usuario(
        email=email,
        senha=senha,
    )

    infoUsuario = acoesUsuario.info_usuario(email=email,id=None)

    match statusLogin:
        case 0:
            return responses.JSONResponse(
                content={
                    "autenticado": "true",
                    "motivo": "",
                    "nome": infoUsuario["nome"],
                },
                status_code=200
            )

        case 1:
            return responses.JSONResponse(
                content={
                    "autenticado": "false",
                    "motivo": "Login incorreto",
                    "nome": ""
                },
                status_code=401
            )
        
        case 2:
            return responses.JSONResponse(
                content={
                    "autenticado": "false",
                    "motivo": "Campos nao preenchidos",
                    "nome": ""
                },
                status_code=400
            )