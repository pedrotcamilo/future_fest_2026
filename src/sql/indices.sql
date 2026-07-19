CREATE INDEX idx_lotes_validade
ON lotes(data_validade);

CREATE INDEX idx_lotes_mp
ON lotes(materia_prima_id);

CREATE INDEX idx_consumo_data
ON historico_consumo(data);

CREATE INDEX idx_movimentacao_data
ON movimentacoes_estoque(data_movimento);

CREATE INDEX idx_previsao_periodo
ON previsoes_consumo(periodo_inicio);

CREATE INDEX idx_ordem_status
ON ordens_producao(status);

CREATE INDEX idx_pedido_data
ON pedidos(data_pedido);