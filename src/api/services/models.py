from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func
from datetime import date, datetime

from api.services.database import Base

class Usuarios(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    telefone: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column()
    admin: Mapped[bool] = mapped_column()
    senha: Mapped[str] = mapped_column()

class Fornecedores(Base):
    __tablename__ = "fornecedores"

    id: Mapped[int] = mapped_column(primary_key=True)
    razao_social: Mapped[str] = mapped_column()
    nome_fantasia: Mapped[str] = mapped_column()
    cnpj: Mapped[str] = mapped_column()
    telefone: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column()
    prazo_entrega_dias: Mapped[int] = mapped_column()
    ativo: Mapped[bool] = mapped_column()

class MateriasPrimas(Base):
    __tablename__ = "materias_primas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column()
    nome: Mapped[str] = mapped_column()
    unidade: Mapped[str] = mapped_column()
    estoque_minimo: Mapped[float] = mapped_column()
    estoque_maximo: Mapped[float] = mapped_column()
    consumo_medio_mensal: Mapped[float] = mapped_column()
    ativo: Mapped[bool] = mapped_column()

class Lotes(Base):
    __tablename__ = "lotes"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_prima_id: Mapped[int] = mapped_column()
    fornecedor_id: Mapped[int] = mapped_column()
    numero_lote: Mapped[str] = mapped_column()
    quantidade_inicial: Mapped[float] = mapped_column()
    quantidade_atual: Mapped[float] = mapped_column()
    data_fabricacao: Mapped[date] = mapped_column()
    data_validade: Mapped[date] = mapped_column()
    data_recebimento: Mapped[date] = mapped_column()
    valor_unitario: Mapped[float] = mapped_column()

class MovimentacoesEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id: Mapped[int] = mapped_column(primary_key=True)
    lote_id: Mapped[int] = mapped_column()
    tipo: Mapped[str] = mapped_column()
    quantidade: Mapped[float] = mapped_column()
    data_movimento: Mapped[datetime] = mapped_column()
    observacao: Mapped[str] = mapped_column()

class Compras(Base):
    __tablename__ = "compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    fornecedor_id: Mapped[int] = mapped_column()
    data_compra: Mapped[date] = mapped_column()
    previsao_entrega: Mapped[date] = mapped_column()
    data_recebimento: Mapped[date] = mapped_column()
    status: Mapped[str] = mapped_column()

class CompraItens(Base):
    __tablename__ = "compra_itens"

    id: Mapped[int] = mapped_column(primary_key=True)
    compra_id: Mapped[int] = mapped_column()
    materia_prima_id: Mapped[int] = mapped_column()
    quantidade: Mapped[float] = mapped_column()
    valor_unitario: Mapped[float] = mapped_column()

class Formulas(Base):
    __tablename__ = "formulas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column()
    descricao: Mapped[str] = mapped_column()
    categoria: Mapped[str] = mapped_column()
    ativa: Mapped[bool] = mapped_column()

class FormulaItens(Base):
    __tablename__ = "formula_itens"

    id: Mapped[int] = mapped_column(primary_key=True)
    formula_id: Mapped[int] = mapped_column()
    materia_prima_id: Mapped[int] = mapped_column()
    quantidade: Mapped[float] = mapped_column()
    unidade: Mapped[str] = mapped_column()

class Clientes(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column()
    telefone: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column()

class Pedidos(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column()
    data_pedido: Mapped[datetime] = mapped_column()
    status: Mapped[str] = mapped_column()
    data_entrega: Mapped[date] = mapped_column()

class PedidoItens(Base):
    __tablename__ = "pedido_itens"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column()
    formula_id: Mapped[int] = mapped_column()
    quantidade: Mapped[int] = mapped_column()

class OrdensProducao(Base):
    __tablename__ = "ordens_producao"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column()
    data_inicio: Mapped[datetime] = mapped_column()
    data_fim: Mapped[datetime] = mapped_column()
    status: Mapped[str] = mapped_column()

class ConsumoProducao(Base):
    __tablename__ = "consumo_producao"

    id: Mapped[int] = mapped_column(primary_key=True)
    ordem_producao_id: Mapped[int] = mapped_column()
    lote_id: Mapped[int] = mapped_column()
    quantidade: Mapped[float] = mapped_column()

class HistoricoConsumo(Base):
    __tablename__ = "historico_consumo"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_prima_id: Mapped[int] = mapped_column()
    data: Mapped[date] = mapped_column()
    quantidade: Mapped[float] = mapped_column()

class PrevisoesConsumo(Base):
    __tablename__ = "previsoes_consumo"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_prima_id: Mapped[int] = mapped_column()
    data_previsao: Mapped[date] = mapped_column()
    periodo_inicio: Mapped[date] = mapped_column()
    periodo_fim: Mapped[date] = mapped_column()
    consumo_previsto: Mapped[float] = mapped_column()
    confianca: Mapped[float] = mapped_column()
    modelo_utilizado: Mapped[str] = mapped_column()

class SugestoesCompra(Base):
    __tablename__ = "sugestoes_compra"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_prima_id: Mapped[int] = mapped_column()
    data_sugestao: Mapped[date] = mapped_column()
    quantidade_sugerida: Mapped[float] = mapped_column()
    motivo: Mapped[str] = mapped_column()
    status: Mapped[str] = mapped_column()

class Alertas(Base):
    __tablename__ = "alertas"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column()
    materia_prima_id: Mapped[int] = mapped_column()
    lote_id: Mapped[int] = mapped_column()
    descricao: Mapped[str] = mapped_column()
    prioridade: Mapped[str] = mapped_column()
    resolvido: Mapped[bool] = mapped_column()
    data_alerta: Mapped[datetime] = mapped_column()
