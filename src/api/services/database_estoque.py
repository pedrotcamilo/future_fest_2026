from sqlalchemy import select, func
from datetime import datetime
from collections import defaultdict
import json

from api.services.ai_request import perguntar
from api.services.database_manager import get_session
from api.services.models import (
    Lotes,
    MovimentacoesEstoque,
    MateriasPrimas,
    HistoricoConsumo,
)

def consultar_estoque():
    with get_session() as session:
        r_mp = session.scalars(select(MateriasPrimas)).all()
        materias = {}
        for row in r_mp:
            materias[row.id] = row.nome

        r_lotes = session.scalars(select(Lotes)).all()
        estoque_map = {}
        for row in r_lotes:
            mp_id = row.materia_prima_id
            qtd = float(row.quantidade_atual) if row.quantidade_atual else 0
            estoque_map[mp_id] = estoque_map.get(mp_id, 0) + qtd

        data = []
        for mp_id, nome in materias.items():
            data.append({
                "materia_prima_id": mp_id,
                "nome": nome,
                "estoque": estoque_map.get(mp_id, 0)
            })

        return data

def consultar_estoque_materia_prima(materia_prima_id: int):
    with get_session() as session:
        stmt = (
            select(Lotes)
            .where(Lotes.materia_prima_id == materia_prima_id)
        )
        result = session.execute(stmt)
        lotes = result.scalars().all()

        return [
            {
                "id": l.id,
                "quantidade_atual": l.quantidade_atual
            }
            for l in lotes
        ]

def registrar_movimentacao(
    lote_id: int,
    tipo: str,
    quantidade: float,
    observacao: str = None
):
    from sqlalchemy import update

    with get_session() as session:
        dados = {
            "lote_id": lote_id,
            "tipo": tipo,
            "quantidade": quantidade,
            "data_movimento": datetime.now(),
            "observacao": observacao
        }

        if tipo == "SAIDA":
            stmt_lote = select(Lotes).where(Lotes.id == lote_id)
            lote = session.execute(stmt_lote).scalars().first()
            if lote is None:
                return "Lote nao encontrado"
            if lote.quantidade_atual < quantidade:
                return "Saldo insuficiente no lote"

            stmt_upd = (
                update(Lotes)
                .where(Lotes.id == lote_id)
                .values(
                    quantidade_atual=Lotes.quantidade_atual - quantidade
                )
            )
            session.execute(stmt_upd)

        elif tipo == "ENTRADA":
            stmt_upd = (
                update(Lotes)
                .where(Lotes.id == lote_id)
                .values(
                    quantidade_atual=Lotes.quantidade_atual + quantidade
                )
            )
            session.execute(stmt_upd)

        stmt_insert = (
            "INSERT INTO movimentacoes_estoque "
            "(lote_id, tipo, quantidade, data_movimento, observacao) "
            "VALUES (:lote_id, :tipo, :quantidade, :data_movimento, :observacao)"
        )
        session.execute(
            stmt_insert,
            dados
        )

        session.commit()
        return "Ok"

def listar_movimentacoes():
    with get_session() as session:
        stmt = select(MovimentacoesEstoque).order_by(
            MovimentacoesEstoque.data_movimento.desc()
        )
        result = session.execute(stmt)
        movs = result.scalars().all()

        return [
            {
                "id": m.id,
                "lote_id": m.lote_id,
                "tipo": m.tipo,
                "quantidade": m.quantidade,
                "data_movimento": str(m.data_movimento),
                "observacao": m.observacao
            }
            for m in movs
        ]

def _to_float(valor, padrao=None):
    if valor is None:
        return padrao
    try:
        return float(valor)
    except (TypeError, ValueError):
        return padrao


def gerar_predicacao_compra(meses_historico: int = 12):

    with get_session() as session:
        materias = session.scalars(select(MateriasPrimas)).all()
        lotes = session.scalars(select(Lotes)).all()
        historicos = session.scalars(select(HistoricoConsumo)).all()

    if not materias:
        return {"erro": "Nenhuma materia-prima cadastrada para analise."}

    # Estoque atual = soma de quantidade_atual dos lotes por materia-prima.
    estoque_map = defaultdict(float)
    for lote in lotes:
        mp_id = getattr(lote, "materia_prima_id", None)
        if mp_id is None:
            continue
        estoque_map[mp_id] += _to_float(
            getattr(lote, "quantidade_atual", 0), 0.0
        ) or 0.0

    # Historico agregado por materia-prima + mes (AAAA-MM).
    consumo_map = defaultdict(lambda: defaultdict(float))
    for h in historicos:
        mp_id = getattr(h, "materia_prima_id", None)
        data = getattr(h, "data", None)
        qtd = _to_float(getattr(h, "quantidade", None), None)
        if mp_id is None or data is None or qtd is None:
            continue
        # `data` pode vir como date/datetime ou string (failover Supabase).
        if isinstance(data, str):
            mes = data[:7]  # "AAAA-MM-DD" -> "AAAA-MM"
        else:
            mes = f"{data.year:04d}-{data.month:02d}"
        consumo_map[mp_id][mes] += qtd

    payload = []
    for mp in materias:
        mp_id = getattr(mp, "id", None)
        meses = sorted(consumo_map.get(mp_id, {}).items())
        # Envia os N meses mais recentes em ordem cronologica.
        meses = meses[-meses_historico:] if meses_historico else meses
        payload.append({
            "id": mp_id,
            "codigo": getattr(mp, "codigo", None),
            "nome": getattr(mp, "nome", None),
            "unidade": getattr(mp, "unidade", None),
            "estoque_minimo": _to_float(
                getattr(mp, "estoque_minimo", None), None
            ),
            "estoque_maximo": _to_float(
                getattr(mp, "estoque_maximo", None), None
            ),
            "consumo_medio_mensal": _to_float(
                getattr(mp, "consumo_medio_mensal", None), None
            ),
            "estoque_atual": estoque_map.get(mp_id, 0.0),
            "consumo_mensal": [
                {"mes": mes, "consumo": round(qtd, 3)}
                for mes, qtd in meses
            ],
            "ativo": getattr(mp, "ativo", True),
        })

    conteudo = json.dumps(payload, ensure_ascii=False, default=str)
    return perguntar("predicacao_compra", conteudo)