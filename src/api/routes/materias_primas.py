from fastapi import APIRouter, responses, Query
from pydantic import BaseModel
from api.services import database_materias_primas, respostas_padrao

router = APIRouter()

class BaseMateriaPrima(BaseModel):
    codigo: str | None = None
    nome: str | None = None
    unidade: str | None = None
    estoque_minimo: float | None = None
    estoque_maximo: float | None = None
    consumo_medio_mensal: float | None = None
    ativo: bool = True

@router.get("/")
async def listar_materias_primas(
    nome: str = Query(None),
    estoque_baixo: bool = Query(None, alias="estoqueBaixo"),
    vencendo: bool = Query(None)
):
    resultado = database_materias_primas.listar_materias_primas(
        nome, estoque_baixo, vencendo
    )
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_materia_prima_id(id: int):
    resultado = database_materias_primas.listar_materia_prima_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_materia_prima(body: BaseMateriaPrima):
    resultado = database_materias_primas.criar_materia_prima(
        codigo=body.codigo,
        nome=body.nome,
        unidade=body.unidade,
        estoque_minimo=body.estoque_minimo,
        estoque_maximo=body.estoque_maximo,
        consumo_medio_mensal=body.consumo_medio_mensal,
        ativo=body.ativo
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.put("/{id}")
async def atualizar_materia_prima(id: int, body: BaseMateriaPrima):
    resultado = database_materias_primas.editar_materia_prima(
        id=id,
        codigo=body.codigo,
        nome=body.nome,
        unidade=body.unidade,
        estoque_minimo=body.estoque_minimo,
        estoque_maximo=body.estoque_maximo,
        consumo_medio_mensal=body.consumo_medio_mensal,
        ativo=body.ativo
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_materia_prima(id: int):
    resultado = database_materias_primas.deletar_materia_prima(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)
