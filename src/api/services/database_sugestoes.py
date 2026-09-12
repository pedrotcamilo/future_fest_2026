from sqlalchemy import select, update
from sqlalchemy import insert
from datetime import date

from api.services.database_manager import get_session
from api.services.models import SugestoesCompra, MateriasPrimas, Lotes

def listar_sugestoes():
    with get_session() as session:
        stmt = select(SugestoesCompra).order_by(
            SugestoesCompra.data_sugestao.desc()
        )
        result = session.execute(stmt)
        sugestoes = result.scalars().all()

        return [
            {
                "id": s.id,
                "materia_prima_id": s.materia_prima_id,
                "data_sugestao": str(s.data_sugestao),
                "quantidade_sugerida": s.quantidade_sugerida,
                "motivo": s.motivo,
                "status": s.status
            }
            for s in sugestoes
        ]

def gerar_sugestoes():
    from sqlalchemy import func

    with get_session() as session:
        stmt_mp = select(MateriasPrimas).where(MateriasPrimas.ativo == True)
        materias = session.execute(stmt_mp).scalars().all()

        sugestoes_criadas = 0
        for mp in materias:
            stmt_estoque = select(func.sum(Lotes.quantidade_atual)).where(
                Lotes.materia_prima_id == mp.id
            )
            total = session.scalar(stmt_estoque) or 0

            if mp.estoque_minimo and float(total) < mp.estoque_minimo:
                necessidade = mp.estoque_maximo - float(total)
                if necessidade > 0:
                    stmt = (
                        insert(SugestoesCompra)
                        .values(
                            materia_prima_id=mp.id,
                            data_sugestao=date.today(),
                            quantidade_sugerida=necessidade,
                            motivo=(
                                f"Estoque abaixo do minimo. "
                                f"Atual: {float(total):.2f}, "
                                f"Minimo: {mp.estoque_minimo}"
                            ),
                            status="PENDENTE"
                        )
                    )
                    session.execute(stmt)
                    sugestoes_criadas += 1

        session.commit()
        return f"{sugestoes_criadas} sugestoes geradas"

def aprovar_sugestao(id: int):
    with get_session() as session:
        stmt = select(SugestoesCompra).where(SugestoesCompra.id == id)
        sugestao = session.execute(stmt).scalars().first()

        if sugestao is None:
            return "Sugestao nao encontrada"

        stmt_upd = (
            update(SugestoesCompra)
            .where(SugestoesCompra.id == id)
            .values(status="APROVADA")
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"

def rejeitar_sugestao(id: int):
    with get_session() as session:
        stmt = select(SugestoesCompra).where(SugestoesCompra.id == id)
        sugestao = session.execute(stmt).scalars().first()

        if sugestao is None:
            return "Sugestao nao encontrada"

        stmt_upd = (
            update(SugestoesCompra)
            .where(SugestoesCompra.id == id)
            .values(status="REJEITADA")
        )
        session.execute(stmt_upd)
        session.commit()
        return "Ok"
