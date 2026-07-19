from sqlalchemy import select, update, delete
from sqlalchemy import insert
from sqlalchemy.orm import Session

from api.services.database import engine
from api.services.models import Fornecedores

def listar_fornecedores(nome: str = None, ativo: bool = None):
    with Session(engine) as session:
        stmt = select(Fornecedores)

        if nome is not None:
            stmt = stmt.where(Fornecedores.nome_fantasia.ilike(f"%{nome}%"))
        if ativo is not None:
            stmt = stmt.where(Fornecedores.ativo == ativo)

        result = session.execute(stmt)
        fornecedores = result.scalars().all()

        return [
            {
                "id": c.id,
                "razao_social": c.razao_social,
                "nome_fantasia": c.nome_fantasia,
                "cnpj": c.cnpj,
                "telefone": c.telefone,
                "email": c.email,
                "prazo_entrega_dias": c.prazo_entrega_dias,
                "ativo": c.ativo
            }
            for c in fornecedores
        ]

def listar_fornecedor_id(id: int):
    with Session(engine) as session:
        stmt = select(Fornecedores).where(Fornecedores.id == id)
        result = session.execute(stmt)
        fornecedor = result.scalar_one_or_none()

        if fornecedor is None:
            return None

        return {
            "id": fornecedor.id,
            "razao_social": fornecedor.razao_social,
            "nome_fantasia": fornecedor.nome_fantasia,
            "cnpj": fornecedor.cnpj,
            "telefone": fornecedor.telefone,
            "email": fornecedor.email,
            "prazo_entrega_dias": fornecedor.prazo_entrega_dias,
            "ativo": fornecedor.ativo
        }

def criar_fornecedor(
    razao_social: str,
    nome_fantasia: str = None,
    cnpj: str = None,
    telefone: str = None,
    email: str = None,
    prazo_entrega_dias: int = None,
    ativo: bool = True
):
    with Session(engine) as session:
        stmt = (
            insert(Fornecedores)
            .values(
                razao_social=razao_social,
                nome_fantasia=nome_fantasia,
                cnpj=cnpj,
                telefone=telefone,
                email=email,
                prazo_entrega_dias=prazo_entrega_dias,
                ativo=ativo
            )
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def editar_fornecedor(id: int, **kwargs):
    with Session(engine) as session:
        valores = {k: v for k, v in kwargs.items() if v is not None}
        if not valores:
            return "Ok"

        stmt = (
            update(Fornecedores)
            .where(Fornecedores.id == id)
            .values(**valores)
        )

        session.execute(stmt)
        session.commit()
        return "Ok"

def deletar_fornecedor(id: int):
    with Session(engine) as session:
        stmt = delete(Fornecedores).where(Fornecedores.id == id)
        session.execute(stmt)
        session.commit()
        return "Ok"
