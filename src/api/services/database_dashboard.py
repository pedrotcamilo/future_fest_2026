from sqlalchemy import select, func

from api.services.database_manager import get_session
from api.services.models import MateriasPrimas, Lotes, Compras, OrdensProducao, Alertas, PrevisoesConsumo, HistoricoConsumo, MovimentacoesEstoque

def resumo_geral():
    with get_session() as session:
        total_materias = session.scalar(
            select(func.count(MateriasPrimas.id))
        ) or 0

        total_compras_pendentes = session.scalar(
            select(func.count(Compras.id)).where(Compras.status == "PENDENTE")
        ) or 0

        ordens_em_producao = session.scalar(
            select(func.count(OrdensProducao.id)).where(
                OrdensProducao.status == "EM_PRODUCAO"
            )
        ) or 0

        alertas_ativos = session.scalar(
            select(func.count(Alertas.id)).where(Alertas.resolvido == False)
        ) or 0

        return {
            "total_materias_primas": total_materias,
            "compras_pendentes": total_compras_pendentes,
            "ordens_em_producao": ordens_em_producao,
            "alertas_ativos": alertas_ativos
        }

def dashboard_estoque():
    with get_session() as session:
        r_mp = session.execute(select(MateriasPrimas))
        materias = {}
        for row in r_mp:
            materias[row.id] = row.nome

        r_lotes = session.execute(select(Lotes))
        estoque_map = {}
        for row in r_lotes:
            mp_id = row.materia_prima_id
            qtd = float(row.quantidade_atual) if row.quantidade_atual else 0
            estoque_map[mp_id] = estoque_map.get(mp_id, 0) + qtd

        estoque = []
        for mp_id, nome in materias.items():
            estoque.append({
                "materia_prima_id": mp_id,
                "nome": nome,
                "estoque": estoque_map.get(mp_id, 0)
            })

        return estoque

def dashboard_compras():
    with get_session() as session:
        pendentes = session.scalar(
            select(func.count(Compras.id)).where(Compras.status == "PENDENTE")
        ) or 0

        recebidas = session.scalar(
            select(func.count(Compras.id)).where(Compras.status == "RECEBIDA")
        ) or 0

        canceladas = session.scalar(
            select(func.count(Compras.id)).where(Compras.status == "CANCELADA")
        ) or 0

        return {
            "pendentes": pendentes,
            "recebidas": recebidas,
            "canceladas": canceladas
        }

def dashboard_producao():
    with get_session() as session:
        pendentes = session.scalar(
            select(func.count(OrdensProducao.id)).where(
                OrdensProducao.status == "PENDENTE"
            )
        ) or 0

        em_producao = session.scalar(
            select(func.count(OrdensProducao.id)).where(
                OrdensProducao.status == "EM_PRODUCAO"
            )
        ) or 0

        finalizadas = session.scalar(
            select(func.count(OrdensProducao.id)).where(
                OrdensProducao.status == "FINALIZADA"
            )
        ) or 0

        canceladas = session.scalar(
            select(func.count(OrdensProducao.id)).where(
                OrdensProducao.status == "CANCELADA"
            )
        ) or 0

        return {
            "pendentes": pendentes,
            "em_producao": em_producao,
            "finalizadas": finalizadas,
            "canceladas": canceladas
        }

def dashboard_previsoes():
    with get_session() as session:
        total_previsoes = session.scalar(
            select(func.count(PrevisoesConsumo.id))
        ) or 0

        total_previsto = session.scalar(
            select(func.sum(PrevisoesConsumo.consumo_previsto))
        ) or 0

        return {
            "total_previsoes": total_previsoes,
            "total_consumo_previsto": float(total_previsto)
        }

def dashboard_alertas():
    with get_session() as session:
        total = session.scalar(
            select(func.count(Alertas.id))
        ) or 0

        nao_resolvidos = session.scalar(
            select(func.count(Alertas.id)).where(Alertas.resolvido == False)
        ) or 0

        alta_prioridade = session.scalar(
            select(func.count(Alertas.id)).where(
                Alertas.resolvido == False,
                Alertas.prioridade == "ALTA"
            )
        ) or 0

        return {
            "total": total,
            "nao_resolvidos": nao_resolvidos,
            "alta_prioridade": alta_prioridade
        }
