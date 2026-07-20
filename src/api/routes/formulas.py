from fastapi import APIRouter, responses
from pydantic import BaseModel
from api.services import database_formulas, respostas_padrao

router = APIRouter()

class BaseFormula(BaseModel):
    codigo: str | None = None
    descricao: str | None = None
    categoria: str | None = None
    ativa: bool = True

class ItemFormulaInput(BaseModel):
    materia_prima_id: int
    quantidade: float
    unidade: str | None = None

class ItemFormulaUpdate(BaseModel):
    quantidade: float | None = None
    unidade: str | None = None

@router.get("/")
async def listar_formulas():
    resultado = database_formulas.listar_formulas()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/{id}")
async def listar_formula_id(id: int):
    resultado = database_formulas.listar_formula_id(id)
    if resultado is None:
        return respostas_padrao.nao_encontrado
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/")
async def criar_formula(body: BaseFormula):
    formula_id = database_formulas.criar_formula(
        codigo=body.codigo,
        descricao=body.descricao,
        categoria=body.categoria,
        ativa=body.ativa
    )
    return responses.JSONResponse(
        content={"id": formula_id, "status": "Ok"}, status_code=200
    )

@router.put("/{id}")
async def atualizar_formula(id: int, body: BaseFormula):
    resultado = database_formulas.editar_formula(
        id=id,
        codigo=body.codigo,
        descricao=body.descricao,
        categoria=body.categoria,
        ativa=body.ativa
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}")
async def deletar_formula(id: int):
    resultado = database_formulas.deletar_formula(id)
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.get("/{id}/itens")
async def listar_itens_formula(id: int):
    resultado = database_formulas.listar_itens_formula(id)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.post("/{id}/itens")
async def adicionar_item_formula(id: int, body: ItemFormulaInput):
    resultado = database_formulas.adicionar_item_formula(
        formula_id=id,
        materia_prima_id=body.materia_prima_id,
        quantidade=body.quantidade,
        unidade=body.unidade
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.put("/{id}/itens/{item_id}")
async def atualizar_item_formula(id: int, item_id: int, body: ItemFormulaUpdate):
    resultado = database_formulas.editar_item_formula(
        item_id=item_id,
        quantidade=body.quantidade,
        unidade=body.unidade
    )
    return responses.PlainTextResponse(content=resultado, status_code=200)

@router.delete("/{id}/itens/{item_id}")
async def deletar_item_formula(id: int, item_id: int):
    resultado = database_formulas.deletar_item_formula(item_id)
    return responses.PlainTextResponse(content=resultado, status_code=200)
