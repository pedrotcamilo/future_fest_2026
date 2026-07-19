from fastapi import APIRouter, responses, Query
from pydantic import BaseModel
from api.services import database_fornecedores, respostas_padrao

router = APIRouter()

class BaseFornecedor(BaseModel):
    razao_social: str
    nome_fantasia: str | None = None
    cnpj: str | None = None
    telefone: str | None = None
    email: str | None = None
    prazo_entrega_dias: int | None = None
    ativo: bool = True

@router.get("/")
async def listar_fornecedores(
    nome: str = Query(None),
    ativo: bool = Query(None)
):
    resultado = database_fornecedores.listar_fornecedores(nome, ativo)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_fornecedor_id(id: int):
    resultado = database_fornecedores.listar_fornecedor_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_fornecedor(body: BaseFornecedor):
    resultado = database_fornecedores.criar_fornecedor(
        razao_social=body.razao_social,
        nome_fantasia=body.nome_fantasia,
        cnpj=body.cnpj,
        telefone=body.telefone,
        email=body.email,
        prazo_entrega_dias=body.prazo_entrega_dias,
        ativo=body.ativo
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.put("/{id}")
async def atualizar_fornecedor(id: int, body: BaseFornecedor):
    resultado = database_fornecedores.editar_fornecedor(
        id=id,
        razao_social=body.razao_social,
        nome_fantasia=body.nome_fantasia,
        cnpj=body.cnpj,
        telefone=body.telefone,
        email=body.email,
        prazo_entrega_dias=body.prazo_entrega_dias,
        ativo=body.ativo
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_fornecedor(id: int):
    resultado = database_fornecedores.deletar_fornecedor(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)
