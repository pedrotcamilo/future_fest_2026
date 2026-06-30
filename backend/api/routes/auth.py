from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class PromptLogin(BaseModel):
    email: str
    senha: str

@router.post("/login")
async def realizar_login(body: PromptLogin):
    pass