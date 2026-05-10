from fastapi import FastAPI, responses, File, UploadFile
from dotenv import load_dotenv
from json_repair import repair_json

import re
import ollama
import json

import acoesUsuario
import ferramentas
import acoesDB

load_dotenv()

app = FastAPI()
regex_email = re.compile(r'^\S+@\S+\.\S+$')

prompt_traducaobula_arquivo = open("prompt_traducaoBula.txt","r")
prompt_traducao_bula = prompt_traducaobula_arquivo.read()
prompt_traducaobula_arquivo.close()

# Ações de Usuário

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
            token = acoesUsuario.gerar_token_usuario(id=infoUsuario["id"])

            return responses.JSONResponse(
                content={
                    "autenticado": "true",
                    "motivo": "",
                    "nome": infoUsuario["nome"],
                    "email": infoUsuario["email"],
                    "token": token
                },
                status_code=200
            )

        case 1:
            return responses.JSONResponse(
                content={
                    "autenticado": "false",
                    "motivo": "Login incorreto",
                    "nome": "",
                    "email": "",
                    "token": ""
                },
                status_code=401
            )
        
        case 2:
            return responses.JSONResponse(
                content={
                    "autenticado": "false",
                    "motivo": "Campos nao preenchidos",
                    "nome": "",
                    "email": "",
                    "token": ""
                },
                status_code=400
            )
        

# Tradução da bula

@app.post("/traducaoBula")
async def traducaoBula(file: UploadFile, token):

    formatosPermitidos = ["image/jpeg", "image/png"]

    if not file.content_type in formatosPermitidos:
        return responses.JSONResponse(
            content={
                "erro": "Formato nao permitido! Somente image/jpeg e image/png sao permitidos!"
            },
            status_code=415
        )
    
    if not acoesUsuario.tokenExiste(token=token):
        return responses.JSONResponse(
            content={"erro": "Token invalido"},
            status_code=401
        )
    
    conteudo = await file.read()

    response = ollama.chat(
        model="gemma4:e2b",
        #model="medgemma:4b",
        messages=[
            {
                "role": "system",
                "content": prompt_traducao_bula
            },
            {
                "role": "user",
                "content": "Siga as instruções do sistema",
                "images": [conteudo]
            },
        ],
        options={"temperature": 0.1},
        tools=[ferramentas.aprovadoAnvisa],
        think=True,
    )

    cleaned = (
        response["message"]["content"].replace("```json", "")
        .replace("```", "")
        .strip()
    )

    json_final = repair_json(cleaned)

    print(response["message"]["thinking"])
    return responses.JSONResponse(content=json.loads(json_final))