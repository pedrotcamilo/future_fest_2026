from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Header, HTTPException, Request, responses
from sqlalchemy.exc import IntegrityError
from api.routes import (
    usuarios, diagnosticos, auth,
    fornecedores, materias_primas, lotes,
    estoque, compras, formulas, clientes,
    pedidos, producao, consumo, previsoes,
    sugestoes, alertas, dashboard, relatorios
)
from api.services import views, database_auth
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    views.criar_views()
    yield


def exigir_login(authorization: str = Header(None)):
    token = database_auth.token_do_header(authorization)
    if token is None or database_auth.email_por_token(token) is None:
        raise HTTPException(status_code=401, detail="Nao autorizado")


app = FastAPI(lifespan=lifespan)


@app.exception_handler(IntegrityError)
async def erro_integridade(request: Request, exc: IntegrityError):
    # Ex.: excluir fornecedor com lotes, ou salvar item sem materia-prima.
    # Sem este handler a resposta era um 500 generico.
    return responses.JSONResponse(
        status_code=409,
        content={"erro": "Operacao viola a integridade dos dados (registro em uso ou referencia invalida)."},
    )


# /auth e /diagnosticos ficam abertos: a tela de login usa os dois antes de
# existir token (as rotas de /auth validam o token por conta propria).
app.include_router(diagnosticos.router, prefix="/diagnosticos", tags=["Diagnostico"])
app.include_router(auth.router, prefix="/auth", tags=["Autenticacao"])

protegido = [Depends(exigir_login)]
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"], dependencies=protegido)
app.include_router(fornecedores.router, prefix="/fornecedores", tags=["Fornecedores"], dependencies=protegido)
app.include_router(materias_primas.router, prefix="/materias-primas", tags=["Materias Primas"], dependencies=protegido)
app.include_router(lotes.router, prefix="/lotes", tags=["Lotes"], dependencies=protegido)
app.include_router(estoque.router, prefix="/estoque", tags=["Estoque"], dependencies=protegido)
app.include_router(compras.router, prefix="/compras", tags=["Compras"], dependencies=protegido)
app.include_router(formulas.router, prefix="/formulas", tags=["Formulas"], dependencies=protegido)
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"], dependencies=protegido)
app.include_router(pedidos.router, prefix="/pedidos", tags=["Pedidos"], dependencies=protegido)
app.include_router(producao.router, prefix="/ordens-producao", tags=["Producao"], dependencies=protegido)
app.include_router(consumo.router, prefix="/consumos", tags=["Consumo"], dependencies=protegido)
app.include_router(previsoes.router, prefix="/previsoes", tags=["Previsoes"], dependencies=protegido)
app.include_router(sugestoes.router, prefix="/sugestoes-compra", tags=["Sugestoes de Compra"], dependencies=protegido)
app.include_router(alertas.router, prefix="/alertas", tags=["Alertas"], dependencies=protegido)
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"], dependencies=protegido)
app.include_router(relatorios.router, prefix="/relatorios", tags=["Relatorios"], dependencies=protegido)
app.mount("/web", StaticFiles(directory="web", html=True), name="Web")
