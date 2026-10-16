import json
import logging
import threading
import time
from datetime import datetime, timezone
from os import getenv
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(verbose=True, dotenv_path=_env_path)

prompts_ia = Path(__file__).parent / "prompts"

# ── Clientes lazy (nao quebrar import quando a chave nao existe) ──────────

_gemini_client = None
_groq_client = None
_groq_client_cfg = None


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    api_key = getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai as _genai

        _gemini_client = _genai.Client(api_key=api_key)
        return _gemini_client
    except Exception as e:
        logger.error("Falha ao inicializar cliente Gemini: %s", e)
        return None


def _groq_base_url() -> str:
    """Base URL normalizada para o SDK oficial.

    O SDK (groq>=1.x) ja usa `https://api.groq.com` como base e adiciona
    `/openai/v1/chat/completions` no endpoint. Passar a base COM o sufixo
    `/openai/v1` duplica o caminho e causa 404 `unknown_url`.
    """
    raw = (getenv("GROQ_BASE_URL") or "https://api.groq.com").rstrip("/")
    if raw.lower().endswith("/openai/v1"):
        raw = raw[: -len("/openai/v1")].rstrip("/") or "https://api.groq.com"
    return raw


def _get_groq_client():
    """Cliente oficial da Groq (biblioteca `groq`, via uv)."""
    global _groq_client, _groq_client_cfg
    api_key = getenv("GROQ_API_KEY")
    if not api_key:
        return None
    base_url = _groq_base_url()
    cfg = (api_key, base_url, _timeout())
    if _groq_client is not None and _groq_client_cfg == cfg:
        return _groq_client
    try:
        from groq import Groq as _Groq

        _groq_client = _Groq(api_key=api_key, base_url=base_url, timeout=cfg[2])
        _groq_client_cfg = cfg
        return _groq_client
    except Exception as e:
        logger.error("Falha ao inicializar cliente Groq: %s", e)
        return None


# ── Round-robin thread-safe + circuit breaker ────────────────────────────

_lock = threading.Lock()
_turno = 0  # proxima posicao inicial no round-robin

# Estado do circuit breaker por provedor: {"falhas": int, "fora_do_ar_ate": float}
_estado = {
    "gemini": {"falhas": 0, "fora_do_ar_ate": 0.0},
    "groq": {"falhas": 0, "fora_do_ar_ate": 0.0},
}


def _max_falhas() -> int:
    try:
        return max(1, int(getenv("AI_MAX_FALHAS") or 2))
    except ValueError:
        return 2


def _cooldown() -> float:
    try:
        return max(1.0, float(getenv("AI_COOLDOWN_SEGUNDOS") or 120))
    except ValueError:
        return 120.0


def _provedor_em_cooldown(provedor: str, agora: float) -> bool:
    return _estado.get(provedor, {}).get("fora_do_ar_ate", 0.0) > agora


def _provedores_configurados() -> list:
    """Retorna a lista de provedores com chave configurada, na ordem preferida."""
    ordem = (getenv("AI_PROVIDERS_ORDER") or "gemini,groq").lower()
    candidatos = [p.strip() for p in ordem.split(",") if p.strip()]
    # Garante que ambos aparecam mesmo se AI_PROVIDERS_ORDER citar so um.
    for p in ("gemini", "groq"):
        if p not in candidatos:
            candidatos.append(p)

    disponiveis = []
    if getenv("GEMINI_API_KEY"):
        disponiveis.append("gemini")
    if getenv("GROQ_API_KEY"):
        disponiveis.append("groq")

    # Mantem a ordem preferida, filtrando pelos que tem chave.
    return [p for p in candidatos if p in disponiveis]


def _base_ordenada() -> list:
    """Provedores configurados com os saudaveis primeiro (sem consumir turno)."""
    provedores = _provedores_configurados()
    if not provedores:
        return []
    agora = time.monotonic()
    saudaveis = [p for p in provedores if not _provedor_em_cooldown(p, agora)]
    em_cooldown = [p for p in provedores if _provedor_em_cooldown(p, agora)]
    base = saudaveis + em_cooldown
    return base if base else provedores  # todos cairam: tenta todos mesmo assim


def _ordem_tentativas() -> list:
    """Round-robin entre provedores saudaveis; caidos vao para o fim.

    Enquanto um provedor estiver em cooldown (fora do ar), ele e
    deslocado para o final da ordem — na pratica o outro assume 100%
    do trafego. Quando o cooldown expira, ele volta a rota (half-open).
    """
    global _turno
    base = _base_ordenada()
    if not base:
        return []
    with _lock:
        inicio = _turno % len(base)
        _turno += 1
    return base[inicio:] + base[:inicio]


def _registrar_sucesso(provedor: str):
    """Sucesso zera as falhas e tira o provedor do cooldown (recuperado)."""
    with _lock:
        info = _estado.get(provedor)
        if info is None:
            return
        if info["falhas"] >= _max_falhas() or info["fora_do_ar_ate"]:
            logger.warning("IA: provedor '%s' se recuperou, voltando a rota.", provedor)
        info["falhas"] = 0
        info["fora_do_ar_ate"] = 0.0


def _registrar_falha(provedor: str):
    """Falha de infraestrutura conta para o circuit breaker.

    Apos AI_MAX_FALHAS falhas consecutivas o provedor sai da rota por
    AI_COOLDOWN_SEGUNDOS e o outro assume o controle.
    """
    with _lock:
        info = _estado.setdefault(provedor, {"falhas": 0, "fora_do_ar_ate": 0.0})
        info["falhas"] += 1
        if info["falhas"] >= _max_falhas() and not _provedor_em_cooldown(
            provedor, time.monotonic()
        ):
            info["fora_do_ar_ate"] = time.monotonic() + _cooldown()
            logger.warning(
                "IA: provedor '%s' fora do ar apos %d falhas consecutivas. "
                "O outro provedor assume o controle por %ss.",
                provedor, info["falhas"], _cooldown(),
            )


def status_provedores() -> dict:
    """Retorna o estado do load balancer (para diagnostico/monitoramento)."""
    agora = time.monotonic()
    with _lock:
        return {
            p: {
                "falhas_consecutivas": info["falhas"],
                "fora_do_ar": info["fora_do_ar_ate"] > agora,
                "volta_em_segundos": max(0.0, info["fora_do_ar_ate"] - agora),
            }
            for p, info in _estado.items()
        }


def provedor_ativo() -> str | None:
    """Quem esta atendendo agora ('gemini', 'groq' ou None).

    Leitura sem efeito colateral: nao consome o turno do round-robin.
    """
    base = _base_ordenada()
    return base[0] if base else None


# ── Chamada por provedor ──────────────────────────────────────────────────

def _timeout() -> int:
    try:
        return int(getenv("AI_TIMEOUT") or 60)
    except ValueError:
        return 60


def _chamar_gemini(prompt_sys: str, conteudo: str) -> str:
    from google.genai import types as genai_types

    client = _get_gemini_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY nao configurada ou cliente indisponivel")
    model = getenv("GEMINI_MODEL") or "gemini-2.0-flash"
    response = client.models.generate_content(
        model=model,
        contents=conteudo,
        config=genai_types.GenerateContentConfig(
            system_instruction=prompt_sys,
            response_mime_type="application/json",
        ),
    )
    return response.text


def _chamar_groq(prompt_sys: str, conteudo: str) -> str:
    client = _get_groq_client()
    if client is None:
        raise RuntimeError("GROQ_API_KEY nao configurada ou cliente indisponivel")
    model = getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt_sys},
            {"role": "user", "content": conteudo},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    try:
        return resp.choices[0].message.content
    except (AttributeError, IndexError, TypeError) as e:
        raise RuntimeError(f"Resposta inesperada da Groq: {resp}") from e


_PROVEDORES = {
    "gemini": _chamar_gemini,
    "groq": _chamar_groq,
}


# ── Helpers ───────────────────────────────────────────────────────────────

def _carregar_prompt_sys(prompt: str) -> str:
    prompt_sys = (prompts_ia / f"{prompt}.md").read_text(encoding="utf-8")
    tz_nome = getenv("TIMEZONE") or "America/Sao_Paulo"
    try:
        agora = datetime.now(ZoneInfo(tz_nome))
    except Exception:
        agora = datetime.now(timezone.utc)
    return f"{prompt_sys}\nHorario: {agora.isoformat()}"


def _extrair_json(texto: str) -> dict:
    """Extrai JSON mesmo quando a IA envolve com ```json ... ```."""
    if not texto or not texto.strip():
        raise ValueError("Resposta vazia da IA")
    t = texto.strip()
    if t.startswith("```"):
        # Remove cerca de codigo markdown: ```json ... ```
        linhas = t.splitlines()
        # descarta primeira linha (```json) e ultima (```)
        if linhas and linhas[0].startswith("```"):
            linhas = linhas[1:]
        if linhas and linhas[-1].strip().startswith("```"):
            linhas = linhas[:-1]
        t = "\n".join(linhas).strip()
    return json.loads(t)


# ── API publica ───────────────────────────────────────────────────────────

def perguntar(prompt: str, conteudo: str):
    """Pergunta a IA usando load balancer gemini <-> groq com failover.

    Mantem a assinatura original: recebe o nome do prompt (arquivo .md) e o
    conteudo (string, idealmente JSON). Retorna o dict parseado ou
    {"erro": "..."} se todos os provedores falharem.

    Se o Gemini estiver fora do ar (falhas consecutivas), o Groq assume
    100% das chamadas ate o Gemini se recuperar, e vice-versa.
    """
    try:
        prompt_sys = _carregar_prompt_sys(prompt)
    except Exception as e:
        return {"erro": f"Prompt '{prompt}' indisponivel: {e}"}

    ordem = _ordem_tentativas()
    if not ordem:
        return {"erro": "Nenhum provedor de IA configurado (GEMINI_API_KEY/GROQ_API_KEY)."}

    erros = {}
    for provedor in ordem:
        try:
            logger.info("IA: tentando provedor '%s' (prompt=%s)", provedor, prompt)
            texto = _PROVEDORES[provedor](prompt_sys, conteudo)
        except Exception as e:
            # Falha de infraestrutura (rede, 429, 5xx, timeout, overload):
            # conta no circuit breaker para tirar o provedor da rota.
            _registrar_falha(provedor)
            erros[provedor] = str(e)
            logger.warning("IA: provedor '%s' falhou: %s", provedor, e)
            continue

        try:
            resultado = _extrair_json(texto)
        except (json.JSONDecodeError, ValueError) as e:
            # Resposta malformada e comportamento do modelo, nao queda do
            # provedor: nao conta no circuit breaker, mas tenta o outro
            # provedor, pois cada modelo formata diferente.
            erros[provedor] = f"JSON devolvido pela IA invalido: {e}"
            logger.warning("IA: provedor '%s' devolveu JSON invalido.", provedor)
            continue

        _registrar_sucesso(provedor)
        return resultado

    detalhe = "; ".join(f"{p}: {msg}" for p, msg in erros.items())
    return {"erro": f"Todas as IAs falharam. {detalhe}"}
