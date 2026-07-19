from fastapi import APIRouter, responses
from api.services import database_dashboard

router = APIRouter()

@router.get("/")
async def resumo_geral():
    resultado = database_dashboard.resumo_geral()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/estoque")
async def dashboard_estoque():
    resultado = database_dashboard.dashboard_estoque()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/compras")
async def dashboard_compras():
    resultado = database_dashboard.dashboard_compras()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/producao")
async def dashboard_producao():
    resultado = database_dashboard.dashboard_producao()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/previsoes")
async def dashboard_previsoes():
    resultado = database_dashboard.dashboard_previsoes()
    return responses.JSONResponse(content=resultado, status_code=200)

@router.get("/alertas")
async def dashboard_alertas():
    resultado = database_dashboard.dashboard_alertas()
    return responses.JSONResponse(content=resultado, status_code=200)
