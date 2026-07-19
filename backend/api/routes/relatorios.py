from fastapi import APIRouter, responses, Query
from datetime import date
from api.services import database_relatorios

router = APIRouter()

@router.get("/consumo")
async def relatorio_consumo(
    inicio: date = Query(None),
    fim: date = Query(None)
):
    resultado = database_relatorios.relatorio_consumo(inicio, fim)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/estoque")
async def relatorio_estoque():
    resultado = database_relatorios.relatorio_estoque()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/vencimentos")
async def relatorio_vencimentos():
    resultado = database_relatorios.relatorio_vencimentos()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/compras")
async def relatorio_compras(
    inicio: date = Query(None),
    fim: date = Query(None)
):
    resultado = database_relatorios.relatorio_compras(inicio, fim)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/producao")
async def relatorio_producao(
    inicio: date = Query(None),
    fim: date = Query(None)
):
    resultado = database_relatorios.relatorio_producao(inicio, fim)
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/previsoes")
async def relatorio_previsoes():
    resultado = database_relatorios.relatorio_previsoes()
    return responses.JSONResponse(content=resultado, status_code=200)
