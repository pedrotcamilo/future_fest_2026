-- ============================================================
-- SEED: Dados ficticios para testes (Farmácia de Manipulação)
-- Execute apos rodar todos os scripts de criacao de tabelas.
-- Ordem: materias_primas -> fornecedores -> lotes -> formulas
--        -> clientes -> pedidos -> ordens_producao -> demais
-- ============================================================

-- Limpeza das tabelas (seguro para ambiente de teste)
TRUNCATE TABLE alertas, compra_itens, compras, consumo_producao,
    formula_itens, formulas, historico_consumo,
    lotes, materias_primas, movimentacoes_estoque, ordens_producao,
    pedidos, pedido_itens, previsoes_consumo, sazonalidade,
    sugestoes_compra, clientes, fornecedores RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------
-- MATERIAS PRIMAS (insumos farmaceuticos)
-- ------------------------------------------------------------
INSERT INTO materias_primas (codigo, nome, unidade, estoque_minimo, estoque_maximo, consumo_medio_mensal, ativo) VALUES
('MP-001', 'Omeprazol', 'g', 500.000, 4000.000, 2200.000, TRUE),
('MP-002', 'Sildenafil 100mg', 'un', 1000.000, 8000.000, 4500.000, TRUE),
('MP-003', 'Lactose monoidratada', 'kg', 10.000, 80.000, 40.000, TRUE),
('MP-004', 'Cápsulas gelatinosas nº 2', 'un', 20000.000, 150000.000, 60000.000, TRUE),
('MP-005', 'Vaselina sólida', 'kg', 5.000, 30.000, 12.000, TRUE),
('MP-006', 'Betametasona', 'g', 50.000, 400.000, 180.000, TRUE),
('MP-007', 'Dipirona sódica', 'g', 1000.000, 8000.000, 3500.000, TRUE),
('MP-008', 'Vitamina C (ácido ascórbico)', 'g', 2000.000, 12000.000, 5500.000, TRUE),
('MP-009', 'Alcachofra (extrato seco)', 'g', 500.000, 3000.000, 1400.000, TRUE),
('MP-010', 'Glucomanano', 'g', 800.000, 5000.000, 2600.000, FALSE);

-- ------------------------------------------------------------
-- FORNECEDORES (distribuidores farmaceuticos)
-- ------------------------------------------------------------
INSERT INTO fornecedores (razao_social, nome_fantasia, cnpj, telefone, email, prazo_entrega_dias, ativo) VALUES
('Quimio Farma Distribuidora Ltda', 'Quimio Farma', '12.345.678/0001-90', '(11) 3123-4000', 'vendas@quimiofarma.com.br', 3, TRUE),
('FarmaInsumos S.A.', 'FarmaInsumos', '23.456.789/0001-01', '(11) 3456-7800', 'contato@farmainsumos.com.br', 5, TRUE),
('BioQuímica Ingredientes', 'BioQuímica', '34.567.890/0001-12', '(19) 3232-1100', 'comercial@bioquimica.com.br', 4, TRUE),
('Gelcaps Brasil', 'Gelcaps', '45.678.901/0001-23', '(35) 3555-8899', 'sac@gelcaps.com.br', 2, TRUE),
('PharmaVet Distribuidora', 'PharmaVet', '56.789.012/0001-34', '(11) 3377-2200', 'export@pharmavet.com.br', 6, TRUE),
('Manipulacao Insumos Ltda', 'Manipula Insumos', '67.890.123/0001-45', '(11) 4122-3366', 'pedidos@manipulainsumos.com.br', 7, TRUE);

-- ------------------------------------------------------------
-- LOTES (lotes dos insumos farmaceuticos)
-- ------------------------------------------------------------
INSERT INTO lotes (materia_prima_id, fornecedor_id, numero_lote, quantidade_inicial, quantidade_atual, data_fabricacao, data_validade, data_recebimento, valor_unitario) VALUES
(1, 1, 'LOT-OME-001', 2500.000, 1450.000, '2026-03-01', '2028-03-01', '2026-06-03', 0.9500),
(1, 1, 'LOT-OME-002', 2000.000, 2000.000, '2026-07-10', '2028-07-10', '2026-07-12', 0.9400),
(2, 2, 'LOT-SIL-001', 5000.000, 3200.000, '2026-02-20', '2027-02-20', '2026-05-22', 0.4100),
(3, 6, 'LOT-LAC-001', 50.000, 32.000, '2026-06-15', '2027-06-15', '2026-06-17', 28.5000),
(4, 4, 'LOT-CAP-001', 90000.000, 42000.000, '2026-05-28', '2029-05-28', '2026-05-29', 0.0060),
(5, 3, 'LOT-VAS-001', 20.000, 8.500, '2026-04-10', '2028-04-10', '2026-04-12', 24.9000),
(6, 2, 'LOT-BET-001', 300.000, 210.000, '2026-03-25', '2027-09-25', '2026-03-27', 15.2000),
(7, 1, 'LOT-DIP-001', 4000.000, 1900.000, '2026-06-01', '2028-06-01', '2026-06-02', 0.0800),
(8, 2, 'LOT-VIT-001', 8000.000, 4300.000, '2026-05-10', '2027-11-10', '2026-05-12', 0.0450),
(9, 5, 'LOT-ALC-001', 2000.000, 850.000, '2026-04-20', '2028-10-20', '2026-04-22', 0.5200);

-- ------------------------------------------------------------
-- HISTORICO DE CONSUMO (3 meses: mai, jun, jul/2026)
-- ------------------------------------------------------------
INSERT INTO historico_consumo (materia_prima_id, data, quantidade) VALUES
(1, '2026-05-10', 2100.000), (1, '2026-06-10', 2180.000), (1, '2026-07-10', 2250.000),
(2, '2026-05-12', 4300.000), (2, '2026-06-12', 4450.000), (2, '2026-07-12', 4620.000),
(3, '2026-05-15', 38.000),  (3, '2026-06-15', 41.000),  (3, '2026-07-15', 43.000),
(4, '2026-05-18', 55000.000), (4, '2026-06-18', 61000.000), (4, '2026-07-18', 64000.000),
(5, '2026-05-20', 11.000),  (5, '2026-06-20', 12.500),  (5, '2026-07-20', 13.000),
(6, '2026-05-22', 165.000), (6, '2026-06-22', 180.000),  (6, '2026-07-22', 192.000),
(7, '2026-05-25', 3300.000), (7, '2026-06-25', 3480.000), (7, '2026-07-25', 3620.000),
(8, '2026-05-27', 5200.000), (8, '2026-06-27', 5450.000), (8, '2026-07-27', 5700.000),
(9, '2026-05-30', 1300.000), (9, '2026-06-30', 1420.000), (9, '2026-07-30', 1490.000);

-- ------------------------------------------------------------
-- FORMULAS (formulas magistrais e oficinais)
-- ------------------------------------------------------------
INSERT INTO formulas (codigo, descricao, categoria, ativa) VALUES
('FML-001', 'Cápsulas de Omeprazol 20mg', 'Gastroenterologia', TRUE),
('FML-002', 'Cápsulas de Sildenafil 50mg', 'Andrologia', TRUE),
('FML-003', 'Pomada de Betametasona 0,5%', 'Dermatologia', TRUE),
('FML-004', 'Cápsulas de Vitamina C 1g', 'Suplementos', TRUE),
('FML-005', 'Cápsulas de Alcachofra 250mg', 'Fitoterapia', FALSE);

INSERT INTO formula_itens (formula_id, materia_prima_id, quantidade, unidade) VALUES
(1, 1, 20.0000, 'mg/cap'),
(1, 3, 280.0000, 'mg/cap'),
(1, 4, 1.0000, 'cap'),
(2, 2, 50.0000, 'mg/cap'),
(2, 3, 150.0000, 'mg/cap'),
(2, 4, 1.0000, 'cap'),
(3, 6, 5.0000, 'mg/g'),
(3, 5, 0.9000, 'g/g'),
(4, 8, 1000.0000, 'mg/cap'),
(4, 4, 1.0000, 'cap'),
(5, 9, 250.0000, 'mg/cap'),
(5, 3, 50.0000, 'mg/cap'),
(5, 4, 1.0000, 'cap');

-- ------------------------------------------------------------
-- SAZONALIDADE
-- ------------------------------------------------------------
INSERT INTO sazonalidade (formula_id, mes, fator) VALUES
(1, 3, 1.10), (1, 12, 1.20),
(2, 2, 1.15), (2, 6, 1.20),
(3, 7, 1.30), (3, 12, 1.10),
(4, 5, 1.25), (4, 7, 1.30), (4, 12, 1.20),
(5, 6, 1.10);

-- ------------------------------------------------------------
-- CLIENTES (clinicas, consultorios e outras farmacias)
-- ------------------------------------------------------------
INSERT INTO clientes (nome, telefone, email) VALUES
('Clínica Vida Plena', '(11) 98765-4321', 'compras@clinicavidaplena.com.br'),
('Consultório Dra. Renata Alves', '(11) 91234-5678', 'contato@drenataalves.com.br'),
('Dermatocenter Ltda', '(11) 3456-7890', 'pedidos@dermatocenter.com.br'),
('NutriClinic', '(19) 98877-6655', 'nutri@nutriclinic.com.br'),
('FarmaPop Drogaria', '(11) 92345-6789', 'cafe@farmaciapop.com.br'),
('VetSaúde Clínica Animal', '(11) 3344-5566', 'atacado@vetsaude.com.br');

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
INSERT INTO pedidos (cliente_id, data_pedido, status, data_entrega) VALUES
(1, '2026-07-01 09:15:00', 'CONCLUIDO', '2026-07-03'),
(2, '2026-07-05 14:30:00', 'CONCLUIDO', '2026-07-07'),
(3, '2026-07-10 10:00:00', 'EM_PRODUCAO', '2026-07-14'),
(4, '2026-07-15 16:45:00', 'EM_PRODUCAO', '2026-07-18'),
(5, '2026-07-20 08:20:00', 'AGUARDANDO', '2026-07-25'),
(6, '2026-07-28 11:00:00', 'AGUARDANDO', '2026-08-02'),
(1, '2026-08-01 09:00:00', 'NOVO', '2026-08-05');

INSERT INTO pedido_itens (pedido_id, formula_id, quantidade) VALUES
(1, 1, 300), (1, 4, 150),
(2, 2, 400),
(3, 3, 60),
(4, 4, 500),
(5, 1, 800), (5, 5, 100),
(6, 3, 40),
(7, 2, 200);

-- ------------------------------------------------------------
-- ORDENS DE PRODUCAO
-- ------------------------------------------------------------
INSERT INTO ordens_producao (pedido_id, data_inicio, data_fim, status) VALUES
(1, '2026-07-01 10:00:00', '2026-07-02 18:00:00', 'CONCLUIDA'),
(2, '2026-07-05 15:00:00', '2026-07-06 16:00:00', 'CONCLUIDA'),
(3, '2026-07-10 11:00:00', '2026-07-12 18:00:00', 'EM_ANDAMENTO'),
(4, '2026-07-15 17:00:00', NULL, 'EM_ANDAMENTO'),
(5, NULL, NULL, 'AGENDADA'),
(6, NULL, NULL, 'AGENDADA');

-- ------------------------------------------------------------
-- CONSUMO EM PRODUCAO
-- ------------------------------------------------------------
INSERT INTO consumo_producao (ordem_producao_id, lote_id, quantidade) VALUES
(1, 1, 6.000),
(1, 4, 84.000),
(2, 2, 20.000),
(3, 3, 8.500),
(3, 5, 8.000);

-- ------------------------------------------------------------
-- MOVIMENTACOES DE ESTOQUE
-- ------------------------------------------------------------
INSERT INTO movimentacoes_estoque (lote_id, tipo, quantidade, data_movimento, observacao) VALUES
(1, 'ENTRADA', 2500.000, '2026-06-03 08:00:00', 'Recebimento nota fiscal 12345'),
(1, 'SAIDA', 1050.000, '2026-06-10 09:00:00', 'Consumo producao'),
(2, 'ENTRADA', 2000.000, '2026-07-12 08:30:00', 'Recebimento nota fiscal 12678'),
(4, 'SAIDA', 12000.000, '2026-07-30 10:00:00', 'Consumo producao'),
(5, 'SAIDA', 48000.000, '2026-07-18 14:00:00', 'Consumo producao'),
(8, 'SAIDA', 2100.000, '2026-07-20 15:00:00', 'Consumo producao'),
(9, 'ENTRADA', 8000.000, '2026-05-12 09:00:00', 'Recebimento nota fiscal 12700'),
(10, 'SAIDA', 1150.000, '2026-07-28 08:00:00', 'Validade proxima, uso prioritario');

-- ------------------------------------------------------------
-- PREVISOES DE CONSUMO (agosto/2026)
-- ------------------------------------------------------------
INSERT INTO previsoes_consumo (materia_prima_id, data_previsao, periodo_inicio, periodo_fim, consumo_previsto, confianca, modelo_utilizado) VALUES
(1, '2026-08-01', '2026-08-01', '2026-08-31', 2320.000, 92.50, 'media_movel'),
(2, '2026-08-01', '2026-08-01', '2026-08-31', 4750.000, 90.10, 'media_movel'),
(3, '2026-08-01', '2026-08-01', '2026-08-31', 44.000, 88.70, 'media_movel'),
(4, '2026-08-01', '2026-08-01', '2026-08-31', 67000.000, 95.20, 'media_movel'),
(5, '2026-08-01', '2026-08-01', '2026-08-31', 13.500, 89.90, 'suavizacao_exponencial'),
(6, '2026-08-01', '2026-08-01', '2026-08-31', 200.000, 85.30, 'media_movel'),
(7, '2026-08-01', '2026-08-01', '2026-08-31', 3750.000, 91.40, 'media_movel'),
(8, '2026-08-01', '2026-08-01', '2026-08-31', 5900.000, 93.60, 'media_movel'),
(9, '2026-08-01', '2026-08-01', '2026-08-31', 1530.000, 87.80, 'sazonal');

-- ------------------------------------------------------------
-- SUGESTOES DE COMPRA
-- ------------------------------------------------------------
INSERT INTO sugestoes_compra (materia_prima_id, data_sugestao, quantidade_sugerida, motivo, status) VALUES
(5, '2026-07-30', 20.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(7, '2026-07-30', 2000.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(8, '2026-07-30', 3000.000, 'Previsao de consumo elevada', 'PENDENTE'),
(9, '2026-07-31', 1500.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(10, '2026-07-31', 800.000, 'Formula inativa, compra suspensa', 'CANCELADA');

-- ------------------------------------------------------------
-- COMPRAS
-- ------------------------------------------------------------
INSERT INTO compras (fornecedor_id, data_compra, previsao_entrega, data_recebimento, status) VALUES
(1, '2026-06-01', '2026-06-03', '2026-06-03', 'RECEBIDA'),
(2, '2026-07-05', '2026-07-15', '2026-07-15', 'RECEBIDA'),
(6, '2026-07-25', '2026-07-30', NULL, 'PENDENTE'),
(1, '2026-08-01', '2026-08-12', NULL, 'PENDENTE');

INSERT INTO compra_itens (compra_id, materia_prima_id, quantidade, valor_unitario) VALUES
(1, 1, 2500.000, 0.95),
(1, 7, 4000.000, 0.08),
(2, 6, 300.000, 15.20),
(2, 8, 8000.000, 0.045),
(3, 3, 50.000, 28.50),
(4, 7, 3500.000, 0.075);

-- ------------------------------------------------------------
-- ALERTAS
-- ------------------------------------------------------------
INSERT INTO alertas (tipo, materia_prima_id, lote_id, descricao, prioridade, resolvido, data_alerta) VALUES
('ESTOQUE_MINIMO', 5, NULL, 'Vaselina sólida abaixo do estoque minimo', 'ALTA', FALSE, '2026-07-30 09:00:00'),
('ESTOQUE_MINIMO', 7, NULL, 'Dipirona sódica abaixo do estoque minimo', 'ALTA', FALSE, '2026-07-30 09:05:00'),
('VENCIMENTO', NULL, 10, 'Lote LOT-ALC-001 com validade proxima', 'MEDIA', FALSE, '2026-07-31 08:00:00'),
('VENCIMENTO', NULL, 8, 'Lote LOT-VIT-001 com validade proxima', 'MEDIA', FALSE, '2026-07-31 08:00:00'),
('VENCIMENTO', NULL, 6, 'Lote LOT-BET-001 com validade proxima', 'BAIXA', FALSE, '2026-07-31 08:00:00'),
('REPOSICAO', NULL, NULL, 'Nova remessa de omeprazol aguardando recebimento', 'BAIXA', TRUE, '2026-08-01 10:00:00');
