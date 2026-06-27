from fastapi import FastAPI
import api.routes
from api.routes import clientes

app = FastAPI()

app.include_router(clientes.router, prefix="/usuarios", tags=["Usuarios"])