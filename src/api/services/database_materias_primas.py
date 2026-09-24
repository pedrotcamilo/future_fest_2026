from sqlalchemy import select, update, delete, func, text
from sqlalchemy import insert
from datetime import date

from api.services.database_manager import get_session
from api.services.models import MateriasPrimas, Lotes

def listar_consumos_mensais(session: Session):
    stmt = text("""
        SELECT materia_prima_id, to_char(mes, 'YYYY-MM') AS mes, consumo
        FROM vw_consumo_mensal
        WHERE mes >= date_trunc('month', CURRENT_DATE) - INTERVAL '6 months'
          AND mes <  date_trunc('month', CURRENT_DATE)
        ORDER BY mes ASC
    """)
    result = session.execute(stmt)
    consumo_mensal = {}
    for row in result:
        consumo_mensal.setdefault(row[0], []).append({
            "mes": row[1],
            "consumo": float(row[2])
        })
    return consumo_mensal

def listar_materias_primas(
    nome: str = None,
    estoque_baixo: bool = None,
    vencendo: bool = None
):
    with get_session() as session:
        stmt = select(MateriasPrimas)

        if nome is not None:
            stmt = stmt.where(MateriasPrimas.nome.ilike(f"%{nome}%"))

        result = session.execute(stmt)
        materias = result.scalars().all()

        consumo_mensal = listar_consumos_mensais(session)

        data = []
        for mp in materias:
            item = {
                "id": mp.id,
                "codigo": mp.codigo,
                "nome": mp.nome,
                "unidade": mp.unidade,
                "estoque_minimo": mp.estoque_minimo,
                "estoque_maximo": mp.estoque_maximo,
                "consumo_medio_mensal": mp.consumo_medio_mensal,
                "consumo_mensal": consumo_mensal.get(mp.id, []),
                "ativo": mp.ativo
            }

            if estoque_baixo:
                stmt_lote = select(func.sum(Lotes.quantidade_atual)).where(
                    Lotes.materia_prima_id == mp.id
                )
                total = session.scalar(stmt_lote) or 0
                item["estoque_atual"] = float(total)

                if mp.estoque_minimo and float(total) >= mp.estoque_minimo:
                    continue

            if vencendo:
                stmt_venc = (
                    select(Lotes)
                    .where(Lotes.materia_prima_id == mp.id)
                    .where(Lotes.quantidade_atual > 0)
                    .where(Lotes.data_validade <= date.today())
                )
                lotes_vencidos = session.execute(stmt_venc).scalars().all()
                if not lotes_vencidos:
                    continue
                item["lotes_vencidos"] = len(lotes_vencidos)

            data.append(item)

        return data

def listar_materia_prima_id(id: int):
    with get_session() as session:
        stmt = select(MateriasPrimas).where(MateriasPrimas.id == id)
        result = session.execute(stmt)
        mp = result.scalars().first()

        if mp is None:
            return None

        return {
            "id": mp.id,
            "codigo": mp.codigo,
            "nome": mp.nome,
            "unidade": mp.unidade,
            "estoque_minimo": mp.estoque_minimo,
            "estoque_maximo": mp.estoque_maximo,
            "consumo_medio_mensal": mp.consumo_medio_mensal,
            "ativo": mp.ativo
        }

def criar_materia_prima(
    codigo: str = None,
    nome: str = None,
    unidade: str = None,
    estoque_minimo: float = None,
    estoque_maximo: float = None,
    consumo_medio_mensal: float = None,
    ativo: bool = True
):
    with get_session() as session:
        stmt = (
            insert(MateriasPrimas)
            .values(
                codigo=codigo,
                nome=nome,
                unidade=unidade,
                estoque_minimo=estoque_minimo,
                estoque_maximo=estoque_maximo,
                consumo_medio_mensal=consumo_medio_mensal,
                ativo=ativo
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_materia_prima(id: int, **kwargs):
    with get_session() as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(MateriasPrimas)
            .where(MateriasPrimas.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_materia_prima(id: int):
    with get_session() as session:
        stmt = delete(MateriasPrimas).where(MateriasPrimas.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"
