from fastapi import APIRouter, responses, Query
from pydantic import BaseModel
from datetime import date
from api.services import database_lotes, respostas_padrao

router = APIRouter()

class BaseLote(BaseModel):
    materia_prima_id: int
    fornecedor_id: int | None = None
    numero_lote: str | None = None
    quantidade_inicial: float | None = None
    quantidade_atual: float | None = None
    data_fabricacao: date | None = None
    data_validade: date | None = None
    data_recebimento: date | None = None
    valor_unitario: float | None = None

@router.get("/")
async def listar_lotes(
    dias_vencimento: int = Query(None, alias="vencimento"),
    materia_prima: int = Query(None, alias="materiaPrima"),
    fornecedor: int = Query(None)
):
    resultado = database_lotes.listar_lotes(
        dias_vencimento, materia_prima, fornecedor
    )
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_lote_id(id: int):
    resultado = database_lotes.listar_lote_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_lote(body: BaseLote):
    resultado = database_lotes.criar_lote(
        materia_prima_id=body.materia_prima_id,
        fornecedor_id=body.fornecedor_id,
        numero_lote=body.numero_lote,
        quantidade_inicial=body.quantidade_inicial,
        quantidade_atual=body.quantidade_atual,
        data_fabricacao=body.data_fabricacao,
        data_validade=body.data_validade,
        data_recebimento=body.data_recebimento,
        valor_unitario=body.valor_unitario
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.put("/{id}")
async def atualizar_lote(id: int, body: BaseLote):
    resultado = database_lotes.editar_lote(
        id=id,
        materia_prima_id=body.materia_prima_id,
        fornecedor_id=body.fornecedor_id,
        numero_lote=body.numero_lote,
        quantidade_inicial=body.quantidade_inicial,
        quantidade_atual=body.quantidade_atual,
        data_fabricacao=body.data_fabricacao,
        data_validade=body.data_validade,
        data_recebimento=body.data_recebimento,
        valor_unitario=body.valor_unitario
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_lote(id: int):
    resultado = database_lotes.deletar_lote(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)
