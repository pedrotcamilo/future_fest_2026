from fastapi import FastAPI, responses
from api.routes import usuarios, diagnosticos
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.include_router(diagnosticos.router, prefix="/diagnosticos", tags=["Informações de Diagnostico"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
app.mount("/web", StaticFiles(directory="web", html=True), name="Web")