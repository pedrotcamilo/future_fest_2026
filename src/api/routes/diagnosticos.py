from fastapi import APIRouter, responses
import platform

router = APIRouter()

@router.get("/informacao_servidor")
async def informacao_servidor():
    tipo_os = platform.system()
    versao_os = platform.version()
    platform_os = platform.platform()

    resposta = f"""
{tipo_os} ({versao_os})
{platform_os}
"""
    return responses.PlainTextResponse(resposta)