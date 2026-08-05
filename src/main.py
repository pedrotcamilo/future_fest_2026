from fastapi import FastAPI
from api.routes import (
    usuarios, diagnosticos, auth,
    fornecedores, materias_primas, lotes,
    estoque, compras, formulas, clientes,
    pedidos, producao, consumo, previsoes,
    sugestoes, alertas, dashboard, relatorios
)
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.include_router(diagnosticos.router, prefix="/diagnosticos", tags=["Diagnostico"])
app.include_router(auth.router, prefix="/auth", tags=["Autenticacao"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(fornecedores.router, prefix="/fornecedores", tags=["Fornecedores"])
app.include_router(materias_primas.router, prefix="/materias-primas", tags=["Materias Primas"])
app.include_router(lotes.router, prefix="/lotes", tags=["Lotes"])
app.include_router(estoque.router, prefix="/estoque", tags=["Estoque"])
app.include_router(compras.router, prefix="/compras", tags=["Compras"])
app.include_router(formulas.router, prefix="/formulas", tags=["Formulas"])
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(pedidos.router, prefix="/pedidos", tags=["Pedidos"])
app.include_router(producao.router, prefix="/ordens-producao", tags=["Producao"])
app.include_router(consumo.router, prefix="/consumos", tags=["Consumo"])
app.include_router(previsoes.router, prefix="/previsoes", tags=["Previsoes"])
app.include_router(sugestoes.router, prefix="/sugestoes-compra", tags=["Sugestoes de Compra"])
app.include_router(alertas.router, prefix="/alertas", tags=["Alertas"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(relatorios.router, prefix="/relatorios", tags=["Relatorios"])
app.mount("/web", StaticFiles(directory="web", html=True), name="Web")