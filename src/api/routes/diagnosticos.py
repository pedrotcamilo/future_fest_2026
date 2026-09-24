from fastapi import APIRouter, responses
import platform

from api.services.database_manager import get_active_db, get_stats, _check_primary_alive

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

@router.get("/status_banco")
async def status_banco():
    stats = get_stats()
    primario_ok = _check_primary_alive()

    return {
        "banco_ativo": stats["banco_ativo"],
        "primario_disponivel": primario_ok,
        "total_failovers": stats["total_failovers"],
        "total_recuperacoes": stats["total_recuperacoes"],
    }
