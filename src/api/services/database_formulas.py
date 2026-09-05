from sqlalchemy import select, update, delete
from sqlalchemy import insert

from api.services.database_manager import get_session
from api.services.models import Formulas, FormulaItens

def listar_formulas():
    with get_session() as session:
        stmt = select(Formulas)
        result = session.execute(stmt)
        formulas = result.scalars().all()

        return [
            {
                "id": f.id,
                "codigo": f.codigo,
                "descricao": f.descricao,
                "categoria": f.categoria,
                "ativa": f.ativa
            }
            for f in formulas
        ]

def listar_formula_id(id: int):
    with get_session() as session:
        stmt = select(Formulas).where(Formulas.id == id)
        result = session.execute(stmt)
        formula = result.scalar_one_or_none()

        if formula is None:
            return None

        stmt_itens = select(FormulaItens).where(FormulaItens.formula_id == id)
        itens = session.execute(stmt_itens).scalars().all()

        return {
            "id": formula.id,
            "codigo": formula.codigo,
            "descricao": formula.descricao,
            "categoria": formula.categoria,
            "ativa": formula.ativa,
            "itens": [
                {
                    "id": i.id,
                    "materia_prima_id": i.materia_prima_id,
                    "quantidade": i.quantidade,
                    "unidade": i.unidade
                }
                for i in itens
            ]
        }

def criar_formula(
    codigo: str = None,
    descricao: str = None,
    categoria: str = None,
    ativa: bool = True
):
    with get_session() as session:
        stmt = (
            insert(Formulas)
            .values(
                codigo=codigo,
                descricao=descricao,
                categoria=categoria,
                ativa=ativa
            )
            .returning(Formulas.id)
        )

        result = session.execute(stmt)
        formula_id = result.scalar_one()
        session.commit()
        return formula_id

def editar_formula(id: int, **kwargs):
    with get_session() as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(Formulas)
            .where(Formulas.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_formula(id: int):
    with get_session() as session:
        stmt_itens = delete(FormulaItens).where(FormulaItens.formula_id == id)
        session.execute(stmt_itens)

        stmt = delete(Formulas).where(Formulas.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"

def listar_itens_formula(formula_id: int):
    with get_session() as session:
        stmt = select(FormulaItens).where(FormulaItens.formula_id == formula_id)
        result = session.execute(stmt)
        itens = result.scalars().all()

        return [
            {
                "id": i.id,
                "materia_prima_id": i.materia_prima_id,
                "quantidade": i.quantidade,
                "unidade": i.unidade
            }
            for i in itens
        ]

def adicionar_item_formula(
    formula_id: int,
    materia_prima_id: int,
    quantidade: float,
    unidade: str = None
):
    with get_session() as session:
        stmt = (
            insert(FormulaItens)
            .values(
                formula_id=formula_id,
                materia_prima_id=materia_prima_id,
                quantidade=quantidade,
                unidade=unidade
            )
        )
        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_item_formula(
    item_id: int,
    quantidade: float = None,
    unidade: str = None
):
    with get_session() as session:
        valores = {}
        if quantidade is not None:
            valores["quantidade"] = quantidade
        if unidade is not None:
            valores["unidade"] = unidade

        if not valores:
            return "Ok"

        stmt = (
            update(FormulaItens)
            .where(FormulaItens.id == item_id)
            .values(**valores)
        )
        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_item_formula(item_id: int):
    with get_session() as session:
        stmt = delete(FormulaItens).where(FormulaItens.id == item_id)
        session.execute(stmt)
        session.commit()
        return "Ok"
