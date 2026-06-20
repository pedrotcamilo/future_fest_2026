from fastapi import FastAPI, responses, File, UploadFile
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from json_repair import repair_json
from openai import OpenAI

import re
import json
import base64
import os

import acoesUsuario
import acoesReceita
import acoesMedicamento

load_dotenv()

app = FastAPI()
regex_email = re.compile(r'^\S+@\S+\.\S+$')

prompt_traducaoreceita_arquivo = open(os.path.join(
    os.path.curdir,
    "prompts",
    "receita.txt"
),"r")
prompt_traducao_receita = prompt_traducaoreceita_arquivo.read()
prompt_traducaoreceita_arquivo.close()

# Ações de Usuário

@app.post("/usuario/registrarUsuario")
async def registar_usuario(email,nome,senha):

    if email is None or nome is None or senha is None:
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
    
@app.delete("/usuario/apagarUsuario")
async def apagar_usuario(id: str):

    if id is None:
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
    
@app.post("/usuario/logarUsuario")
async def logar_usuario(email, senha):

    if email is None or senha is None:
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
    return None


@app.post("/usuario/authToken")
async def auth_token(token):

    if token is None:
        return responses.JSONResponse(
            content={
                "autenticado": "false",
            },
            status_code=400
        )

    else:
        infoUsuario = acoesUsuario.logar_usuario_token(
            token=token
        )

        if infoUsuario:
            novo_token = acoesUsuario.gerar_token_usuario(
                id=infoUsuario["id"]
            )
            return responses.JSONResponse(
                content={
                    "id": infoUsuario["id"],
                    "nome": infoUsuario["nome"],
                    "novo_token": novo_token
                },
                status_code=200
            )


    return responses.JSONResponse(
        content={
            "autenticado": "false",
        },
        status_code=400
    )


app.mount("/admin", StaticFiles(directory="static",html = True))

@app.get("/usuario/listarUsuarios")
async def listar_usuarios():
    usuarios = acoesUsuario.listar_usuarios()

    return responses.JSONResponse(content=usuarios)

@app.post("/usuario/resetarSenha")
def resetar_senha(email, codReset, senha_nova):

    if email is None or codReset is None or senha_nova is None:
        return responses.JSONResponse(
            content={
                "message": "Campos vazios"
            },
            status_code=400
        )
    
    status = acoesUsuario.atualizar_senha(
        email=email,
        codReset=codReset,
        senha_nova=senha_nova
    )

    match status:
        case 0:
            return responses.JSONResponse(
                content={
                    "message": "Senha alterada!"
                },
                status_code=200
            )
        
        case 3:
            return responses.JSONResponse(
                content={
                    "message": "Codigo invalido"
                },
                status_code=400
            )
        
        case _:
            return responses.JSONResponse(
                content={
                    "error": status
                },
                status_code=500
            )
        
@app.get("/usuario/codigosReset")
def codigos_reset():
    return responses.JSONResponse(
        content=acoesUsuario.listar_codigos_reset(),
        status_code=200
    )

@app.post("/receitas/extrairReceita")
async def extrair_receita(file: UploadFile, token):
    formatosPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/gif",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    openroute_client = OpenAI(
        api_key=os.environ.get("OPENROUTE_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    )

    if file.content_type not in formatosPermitidos:
        return responses.JSONResponse(
            content={
                "erro": f"Formato nao permitido! Somente {formatosPermitidos} sao permitidos!"
            },
            status_code=415
        )

    if not acoesUsuario.token_existe(token=token):
        return responses.JSONResponse(
            content={"erro": "Token invalido"},
            status_code=401
        )

    conteudo = await file.read()

    image_b64 = base64.b64encode(conteudo).decode("utf-8")

    response = openroute_client.chat.completions.create(
        model="nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": prompt_traducao_receita
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Siga as instruções do sistema"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{file.content_type};base64,{image_b64}"
                        }
                    }
                ]
            }
        ]
    )

    cleaned = (
        response.choices[0].message.content
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    json_final = repair_json(cleaned)

    return responses.JSONResponse(
        content=json.loads(json_final)
    )

@app.post("/receitas/informacoes/{id_usuario}")
def info_receitas(id_usuario: int, token: str):

    if id_usuario is None or token is None:
        return responses.JSONResponse(
            content={
                "erro": "Campos pendentes"
            },
            status_code=401
        )

    status_token = acoesUsuario.token_correto(
        id=id_usuario,
        token=token
    )

    if not status_token:
        return responses.JSONResponse(
            content={
                "erro": "Token incorreto!"
            }
        )

    receitas_usuario = acoesReceita.listar_receitas_usuario(
        id=id_usuario
    )

    return responses.JSONResponse(
        content=receitas_usuario,
        status_code=200
    )

@app.post("/medicamentos/registrarMedicamento")
def registrar_medicamento(nome, principio_ativo, laboratorio, concentracao, forma_farmaceutica, via_administracao, registro_anvisa, descricao):

    if nome is None or principio_ativo is None or laboratorio is None or concentracao is None or forma_farmaceutica is None or via_administracao is None or registro_anvisa is None:
        return responses.JSONResponse(
            content={
                "erro": "Campos pendentes"
            }
        )

    status_registro = acoesMedicamento.adicionar_medicamento(
        nome=nome,
        principio_ativo=principio_ativo,
        laboratorio=laboratorio,
        concentracao=concentracao,
        forma_farmaceutica=forma_farmaceutica,
        via_administracao=via_administracao,
        registro_anvisa=registro_anvisa,
        descricao=descricao
    )

    match status_registro:
        case 0:
            return responses.JSONResponse(
                content={
                    "info": "Medicamento registrado!"
                }
            )

        case _:
            return responses.JSONResponse(
                content={
                    "erro": status_registro
                }
            )