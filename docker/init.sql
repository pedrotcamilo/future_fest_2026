-- ============================================================
-- SEED: Dados ficticios para testes (Farmacia de Manipulacao)
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
('MP-004', 'Capsulas gelatinosas no 2', 'un', 20000.000, 150000.000, 60000.000, TRUE),
('MP-005', 'Vaselina solida', 'kg', 5.000, 30.000, 12.000, TRUE),
('MP-006', 'Betametasona', 'g', 50.000, 400.000, 180.000, TRUE),
('MP-007', 'Dipirona sodica', 'g', 1000.000, 8000.000, 3500.000, TRUE),
('MP-008', 'Vitamina C (acido ascorbico)', 'g', 2000.000, 12000.000, 5500.000, TRUE),
('MP-009', 'Alcachofra (extrato seco)', 'g', 500.000, 3000.000, 1400.000, FALSE),
('MP-010', 'Glucomanano', 'g', 800.000, 5000.000, 2600.000, FALSE),
('MP-011', 'Ibuprofeno', 'g', 1500.000, 10000.000, 4800.000, TRUE),
('MP-012', 'Paracetamol', 'g', 2000.000, 15000.000, 7200.000, TRUE),
('MP-013', 'Amoxicilina', 'g', 800.000, 6000.000, 2900.000, TRUE),
('MP-014', 'Capsulas gelatinosas no 0', 'un', 15000.000, 120000.000, 45000.000, TRUE),
('MP-015', 'Maltodextrina', 'kg', 8.000, 60.000, 28.000, TRUE),
('MP-016', 'Acido hialuronico', 'g', 200.000, 1500.000, 650.000, TRUE),
('MP-017', 'Colageno hidrolisado', 'kg', 3.000, 25.000, 11.000, TRUE),
('MP-018', 'Zinco picolinato', 'g', 150.000, 1200.000, 480.000, TRUE),
('MP-019', 'Magnesio quelado', 'g', 300.000, 2500.000, 1100.000, TRUE),
('MP-020', 'Melatonina', 'g', 100.000, 800.000, 320.000, TRUE);

-- ------------------------------------------------------------
-- FORNECEDORES (distribuidores farmaceuticos)
-- ------------------------------------------------------------
INSERT INTO fornecedores (razao_social, nome_fantasia, cnpj, telefone, email, prazo_entrega_dias, ativo) VALUES
('Quimio Farma Distribuidora Ltda', 'Quimio Farma', '12.345.678/0001-90', '(11) 3123-4000', 'vendas@quimiofarma.com.br', 3, TRUE),
('FarmaInsumos S.A.', 'FarmaInsumos', '23.456.789/0001-01', '(11) 3456-7800', 'contato@farmainsumos.com.br', 5, TRUE),
('BioQuimica Ingredientes', 'BioQuimica', '34.567.890/0001-12', '(19) 3232-1100', 'comercial@bioquimica.com.br', 4, TRUE),
('Gelcaps Brasil', 'Gelcaps', '45.678.901/0001-23', '(35) 3555-8899', 'sac@gelcaps.com.br', 2, TRUE),
('PharmaVet Distribuidora', 'PharmaVet', '56.789.012/0001-34', '(11) 3377-2200', 'export@pharmavet.com.br', 6, TRUE),
('Manipulacao Insumos Ltda', 'Manipula Insumos', '67.890.123/0001-45', '(11) 4122-3366', 'pedidos@manipulainsumos.com.br', 7, TRUE),
('NutriFarma Ingredientes', 'NutriFarma', '78.901.234/0001-56', '(21) 3555-1234', 'vendas@nutrifarma.com.br', 4, TRUE),
('FarmoQuimica Nacional', 'FarmoQuimica', '89.012.345/0001-67', '(11) 3666-5678', 'comercial@farmoquimica.com.br', 3, TRUE),
('VitaBase Ingredientes', 'VitaBase', '90.123.456/0001-78', '(19) 3777-9012', 'pedidos@vitabase.com.br', 5, TRUE),
('DermoCaps Manipulacao', 'DermoCaps', '01.234.567/0001-89', '(11) 3888-3456', 'insumos@dermocaps.com.br', 2, TRUE);

-- ------------------------------------------------------------
-- LOTES (lotes dos insumos farmaceuticos)
-- ------------------------------------------------------------
INSERT INTO lotes (materia_prima_id, fornecedor_id, numero_lote, quantidade_inicial, quantidade_atual, data_fabricacao, data_validade, data_recebimento, valor_unitario) VALUES
(1, 1, 'LOT-OME-001', 2500.000, 1450.000, '2026-03-01', '2028-03-01', '2026-06-03', 0.9500),
(1, 1, 'LOT-OME-002', 2000.000, 2000.000, '2026-07-10', '2028-07-10', '2026-07-12', 0.9400),
(2, 2, 'LOT-SIL-001', 5000.000, 3200.000, '2026-02-20', '2027-02-20', '2026-05-22', 0.4100),
(2, 2, 'LOT-SIL-002', 3000.000, 3000.000, '2026-06-15', '2027-06-15', '2026-06-18', 0.4000),
(3, 6, 'LOT-LAC-001', 50.000, 32.000, '2026-06-15', '2027-06-15', '2026-06-17', 28.5000),
(3, 6, 'LOT-LAC-002', 40.000, 40.000, '2026-07-20', '2027-07-20', '2026-07-22', 28.0000),
(4, 4, 'LOT-CAP-001', 90000.000, 42000.000, '2026-05-28', '2029-05-28', '2026-05-29', 0.0060),
(4, 4, 'LOT-CAP-002', 75000.000, 75000.000, '2026-07-05', '2029-07-05', '2026-07-06', 0.0058),
(5, 3, 'LOT-VAS-001', 20.000, 8.500, '2026-04-10', '2028-04-10', '2026-04-12', 24.9000),
(6, 2, 'LOT-BET-001', 300.000, 210.000, '2026-03-25', '2027-09-25', '2026-03-27', 15.2000),
(6, 2, 'LOT-BET-002', 200.000, 200.000, '2026-06-10', '2027-12-10', '2026-06-12', 15.0000),
(7, 1, 'LOT-DIP-001', 4000.000, 1900.000, '2026-06-01', '2028-06-01', '2026-06-02', 0.0800),
(7, 1, 'LOT-DIP-002', 5000.000, 5000.000, '2026-07-15', '2028-07-15', '2026-07-16', 0.0780),
(8, 2, 'LOT-VIT-001', 8000.000, 4300.000, '2026-05-10', '2027-11-10', '2026-05-12', 0.0450),
(8, 7, 'LOT-VIT-002', 6000.000, 6000.000, '2026-07-01', '2027-12-01', '2026-07-03', 0.0430),
(9, 5, 'LOT-ALC-001', 2000.000, 850.000, '2026-04-20', '2028-10-20', '2026-04-22', 0.5200),
(11, 8, 'LOT-IBU-001', 6000.000, 3800.000, '2026-04-05', '2028-04-05', '2026-04-07', 0.1200),
(11, 8, 'LOT-IBU-002', 4000.000, 4000.000, '2026-07-20', '2028-07-20', '2026-07-22', 0.1180),
(12, 1, 'LOT-PAR-001', 8000.000, 5200.000, '2026-03-15', '2028-03-15', '2026-03-17', 0.0650),
(12, 1, 'LOT-PAR-002', 7000.000, 7000.000, '2026-06-25', '2028-06-25', '2026-06-27', 0.0630),
(13, 3, 'LOT-AMO-001', 3500.000, 2100.000, '2026-05-01', '2027-05-01', '2026-05-03', 0.3500),
(14, 4, 'LOT-CA0-001', 60000.000, 28000.000, '2026-04-18', '2029-04-18', '2026-04-19', 0.0070),
(14, 4, 'LOT-CA0-002', 50000.000, 50000.000, '2026-07-10', '2029-07-10', '2026-07-11', 0.0068),
(15, 9, 'LOT-MAL-001', 30.000, 18.500, '2026-05-20', '2027-05-20', '2026-05-22', 12.8000),
(16, 10, 'LOT-HIA-001', 800.000, 520.000, '2026-06-01', '2028-06-01', '2026-06-03', 8.5000),
(17, 9, 'LOT-COL-001', 12.000, 7.500, '2026-04-25', '2027-04-25', '2026-04-27', 35.0000),
(18, 7, 'LOT-ZIN-001', 600.000, 380.000, '2026-05-15', '2028-05-15', '2026-05-17', 2.1000),
(19, 9, 'LOT-MAG-001', 1200.000, 750.000, '2026-06-10', '2028-06-10', '2026-06-12', 1.8000),
(20, 3, 'LOT-MEL-001', 400.000, 250.000, '2026-05-28', '2027-05-28', '2026-05-30', 4.5000);

-- ------------------------------------------------------------
-- HISTORICO DE CONSUMO (6 meses: abr a set/2026)
-- ------------------------------------------------------------
INSERT INTO historico_consumo (materia_prima_id, data, quantidade) VALUES
(1, '2026-04-10', 2050.000), (1, '2026-05-10', 2100.000), (1, '2026-06-10', 2180.000),
(1, '2026-07-10', 2250.000), (1, '2026-08-10', 2300.000), (1, '2026-09-10', 2350.000),
(2, '2026-04-12', 4200.000), (2, '2026-05-12', 4300.000), (2, '2026-06-12', 4450.000),
(2, '2026-07-12', 4620.000), (2, '2026-08-12', 4750.000), (2, '2026-09-12', 4800.000),
(3, '2026-04-15', 36.000),  (3, '2026-05-15', 38.000),  (3, '2026-06-15', 41.000),
(3, '2026-07-15', 43.000),  (3, '2026-08-15', 44.500),  (3, '2026-09-15', 45.000),
(4, '2026-04-18', 52000.000), (4, '2026-05-18', 55000.000), (4, '2026-06-18', 61000.000),
(4, '2026-07-18', 64000.000), (4, '2026-08-18', 66000.000), (4, '2026-09-18', 67500.000),
(5, '2026-04-20', 10.500),  (5, '2026-05-20', 11.000),  (5, '2026-06-20', 12.500),
(5, '2026-07-20', 13.000),  (5, '2026-08-20', 13.500),  (5, '2026-09-20', 14.000),
(6, '2026-04-22', 160.000), (6, '2026-05-22', 165.000), (6, '2026-06-22', 180.000),
(6, '2026-07-22', 192.000), (6, '2026-08-22', 200.000), (6, '2026-09-22', 205.000),
(7, '2026-04-25', 3100.000), (7, '2026-05-25', 3300.000), (7, '2026-06-25', 3480.000),
(7, '2026-07-25', 3620.000), (7, '2026-08-25', 3750.000), (7, '2026-09-25', 3850.000),
(8, '2026-04-27', 5000.000), (8, '2026-05-27', 5200.000), (8, '2026-06-27', 5450.000),
(8, '2026-07-27', 5700.000), (8, '2026-08-27', 5900.000), (8, '2026-09-27', 6000.000),
(9, '2026-04-30', 1250.000), (9, '2026-05-30', 1300.000), (9, '2026-06-30', 1420.000),
(9, '2026-07-30', 1490.000), (9, '2026-08-30', 1530.000), (9, '2026-09-30', 1560.000),
(11, '2026-04-08', 4600.000), (11, '2026-05-08', 4700.000), (11, '2026-06-08', 4850.000),
(11, '2026-07-08', 5000.000), (11, '2026-08-08', 5100.000), (11, '2026-09-08', 5200.000),
(12, '2026-04-10', 6800.000), (12, '2026-05-10', 7000.000), (12, '2026-06-10', 7150.000),
(12, '2026-07-10', 7300.000), (12, '2026-08-10', 7500.000), (12, '2026-09-10', 7600.000),
(13, '2026-04-12', 2700.000), (13, '2026-05-12', 2800.000), (13, '2026-06-12', 2900.000),
(13, '2026-07-12', 3000.000), (13, '2026-08-12', 3050.000), (13, '2026-09-12', 3100.000),
(16, '2026-04-15', 600.000), (16, '2026-05-15', 620.000), (16, '2026-06-15', 640.000),
(16, '2026-07-15', 660.000), (16, '2026-08-15', 680.000), (16, '2026-09-15', 700.000),
(17, '2026-04-18', 10.500), (17, '2026-05-18', 11.000), (17, '2026-06-18', 11.500),
(17, '2026-07-18', 12.000), (17, '2026-08-18', 12.500), (17, '2026-09-18', 12.800),
(18, '2026-04-20', 450.000), (18, '2026-05-20', 465.000), (18, '2026-06-20', 480.000),
(18, '2026-07-20', 495.000), (18, '2026-08-20', 500.000), (18, '2026-09-20', 510.000),
(19, '2026-04-22', 1050.000), (19, '2026-05-22', 1080.000), (19, '2026-06-22', 1100.000),
(19, '2026-07-22', 1120.000), (19, '2026-08-22', 1150.000), (19, '2026-09-22', 1180.000),
(20, '2026-04-25', 300.000), (20, '2026-05-25', 310.000), (20, '2026-06-25', 320.000),
(20, '2026-07-25', 330.000), (20, '2026-08-25', 340.000), (20, '2026-09-25', 350.000);

-- ------------------------------------------------------------
-- FORMULAS (formulas magistrais e oficinais)
-- ------------------------------------------------------------
INSERT INTO formulas (codigo, descricao, categoria, ativa) VALUES
('FML-001', 'Capsulas de Omeprazol 20mg', 'Gastroenterologia', TRUE),
('FML-002', 'Capsulas de Sildenafil 50mg', 'Andrologia', TRUE),
('FML-003', 'Pomada de Betametasona 0,5%', 'Dermatologia', TRUE),
('FML-004', 'Capsulas de Vitamina C 1g', 'Suplementos', TRUE),
('FML-005', 'Capsulas de Alcachofra 250mg', 'Fitoterapia', FALSE),
('FML-006', 'Capsulas de Ibuprofeno 400mg', 'Anti-inflamatorio', TRUE),
('FML-007', 'Capsulas de Paracetamol 750mg', 'Analgesico', TRUE),
('FML-008', 'Capsulas de Amoxicilina 500mg', 'Antibiotico', TRUE),
('FML-009', 'Capsulas de Colageno + Acido Hialuronico', 'Dermatologia', TRUE),
('FML-010', 'Capsulas de Zinco + Magnesio', 'Suplementos', TRUE),
('FML-011', 'Capsulas de Melatonina 3mg', 'Sono', TRUE);

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
(5, 4, 1.0000, 'cap'),
(6, 11, 400.0000, 'mg/cap'),
(6, 3, 120.0000, 'mg/cap'),
(6, 14, 1.0000, 'cap'),
(7, 12, 750.0000, 'mg/cap'),
(7, 3, 200.0000, 'mg/cap'),
(7, 4, 1.0000, 'cap'),
(8, 13, 500.0000, 'mg/cap'),
(8, 3, 250.0000, 'mg/cap'),
(8, 4, 1.0000, 'cap'),
(9, 17, 500.0000, 'mg/cap'),
(9, 16, 100.0000, 'mg/cap'),
(9, 14, 1.0000, 'cap'),
(10, 18, 30.0000, 'mg/cap'),
(10, 19, 150.0000, 'mg/cap'),
(10, 3, 100.0000, 'mg/cap'),
(10, 4, 1.0000, 'cap'),
(11, 20, 3.0000, 'mg/cap'),
(11, 3, 100.0000, 'mg/cap'),
(11, 4, 1.0000, 'cap');

-- ------------------------------------------------------------
-- SAZONALIDADE
-- ------------------------------------------------------------
INSERT INTO sazonalidade (formula_id, mes, fator) VALUES
(1, 3, 1.10), (1, 7, 1.05), (1, 12, 1.20),
(2, 2, 1.15), (2, 6, 1.20), (2, 11, 1.10),
(3, 7, 1.30), (3, 8, 1.25), (3, 12, 1.10),
(4, 5, 1.25), (4, 6, 1.30), (4, 7, 1.30), (4, 12, 1.20),
(5, 6, 1.10),
(6, 1, 1.05), (6, 6, 1.15), (6, 12, 1.10),
(7, 1, 1.10), (7, 7, 1.20), (7, 12, 1.15),
(8, 2, 1.10), (8, 8, 1.15), (8, 3, 1.20),
(9, 4, 1.10), (9, 8, 1.15), (9, 11, 1.05),
(10, 1, 1.15), (10, 6, 1.10), (10, 12, 1.20),
(11, 9, 1.05), (11, 10, 1.10), (11, 12, 1.15);

-- ------------------------------------------------------------
-- CLIENTES (clinicas, consultorios e outras farmacias)
-- ------------------------------------------------------------
INSERT INTO clientes (nome, telefone, email) VALUES
('Clinica Vida Plena', '(11) 98765-4321', 'compras@clinicavidaplena.com.br'),
('Consultorio Dra. Renata Alves', '(11) 91234-5678', 'contato@drenataalves.com.br'),
('Dermatocenter Ltda', '(11) 3456-7890', 'pedidos@dermatocenter.com.br'),
('NutriClinic', '(19) 98877-6655', 'nutri@nutriclinic.com.br'),
('FarmaPop Drogaria', '(11) 92345-6789', 'cafe@farmaciapop.com.br'),
('VetSaude Clinica Animal', '(11) 3344-5566', 'atacado@vetsaude.com.br'),
('Ortopedia Total', '(11) 95678-1234', 'contato@ortopediatotal.com.br'),
('Farmacia Popular Rede', '(21) 3678-9012', 'compras@farmaciapopular.com.br'),
('Clinica Sleep Bem', '(11) 94567-8901', 'contato@sleepbem.com.br'),
('CardioVida Especialidades', '(11) 3789-0123', 'enfermagem@cardiavida.com.br'),
('Farmacia Manipular Bem', '(19) 3890-1234', 'pedidos@manipularbem.com.br'),
('Gastro Center SP', '(11) 93456-7890', 'compras@gastrocentersp.com.br');

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
(1, '2026-08-01 09:00:00', 'NOVO', '2026-08-05'),
(7, '2026-07-02 11:30:00', 'CONCLUIDO', '2026-07-04'),
(8, '2026-07-08 08:45:00', 'CONCLUIDO', '2026-07-11'),
(9, '2026-07-12 15:00:00', 'EM_PRODUCAO', '2026-07-16'),
(10, '2026-07-18 09:30:00', 'EM_PRODUCAO', '2026-07-22'),
(11, '2026-07-22 14:15:00', 'AGUARDANDO', '2026-07-27'),
(12, '2026-07-25 10:00:00', 'AGUARDANDO', '2026-07-30'),
(3, '2026-08-02 11:00:00', 'NOVO', '2026-08-06'),
(5, '2026-08-03 08:30:00', 'NOVO', '2026-08-08'),
(8, '2026-08-04 16:00:00', 'NOVO', '2026-08-09'),
(10, '2026-08-05 09:45:00', 'NOVO', '2026-08-10');

INSERT INTO pedido_itens (pedido_id, formula_id, quantidade) VALUES
(1, 1, 300), (1, 4, 150),
(2, 2, 400),
(3, 3, 60),
(4, 4, 500),
(5, 1, 800), (5, 5, 100),
(6, 3, 40),
(7, 2, 200),
(8, 6, 350), (8, 7, 200),
(9, 9, 250), (9, 10, 150),
(10, 11, 500),
(11, 1, 600), (11, 8, 300),
(12, 7, 400),
(13, 6, 200), (13, 9, 100),
(14, 3, 80), (14, 4, 300),
(15, 1, 500), (15, 11, 250),
(16, 9, 200), (16, 10, 300),
(17, 2, 150), (17, 7, 250);

-- ------------------------------------------------------------
-- ORDENS DE PRODUCAO
-- ------------------------------------------------------------
INSERT INTO ordens_producao (pedido_id, data_inicio, data_fim, status) VALUES
(1, '2026-07-01 10:00:00', '2026-07-02 18:00:00', 'CONCLUIDA'),
(2, '2026-07-05 15:00:00', '2026-07-06 16:00:00', 'CONCLUIDA'),
(3, '2026-07-10 11:00:00', '2026-07-12 18:00:00', 'EM_ANDAMENTO'),
(4, '2026-07-15 17:00:00', NULL, 'EM_ANDAMENTO'),
(5, NULL, NULL, 'AGENDADA'),
(6, NULL, NULL, 'AGENDADA'),
(7, '2026-08-01 10:00:00', '2026-08-01 17:30:00', 'CONCLUIDA'),
(8, '2026-07-02 12:00:00', '2026-07-03 18:00:00', 'CONCLUIDA'),
(9, '2026-07-08 09:00:00', '2026-07-10 16:00:00', 'CONCLUIDA'),
(10, '2026-07-12 16:00:00', NULL, 'EM_ANDAMENTO'),
(11, '2026-07-18 10:00:00', NULL, 'EM_ANDAMENTO'),
(12, NULL, NULL, 'AGENDADA'),
(13, NULL, NULL, 'AGENDADA'),
(14, NULL, NULL, 'AGENDADA');

-- ------------------------------------------------------------
-- CONSUMO EM PRODUCAO
-- ------------------------------------------------------------
INSERT INTO consumo_producao (ordem_producao_id, lote_id, quantidade) VALUES
(1, 1, 6.000),
(1, 4, 84.000),
(2, 2, 20.000),
(3, 3, 8.500),
(3, 5, 8.000),
(7, 3, 12.000),
(7, 4, 60.000),
(8, 17, 14.000),
(8, 19, 28.000),
(9, 15, 25.000),
(9, 27, 2.500),
(10, 22, 10.000),
(10, 4, 72.000),
(11, 1, 12.000),
(11, 22, 30.000);

-- ------------------------------------------------------------
-- MOVIMENTACOES DE ESTOQUE
-- ------------------------------------------------------------
INSERT INTO movimentacoes_estoque (lote_id, tipo, quantidade, data_movimento, observacao) VALUES
(1, 'ENTRADA', 2500.000, '2026-06-03 08:00:00', 'Recebimento nota fiscal 12345'),
(1, 'SAIDA', 1050.000, '2026-06-10 09:00:00', 'Consumo producao'),
(2, 'ENTRADA', 2000.000, '2026-07-12 08:30:00', 'Recebimento nota fiscal 12678'),
(2, 'SAIDA', 100.000, '2026-07-15 10:00:00', 'Consumo producao'),
(4, 'ENTRADA', 3000.000, '2026-06-18 09:00:00', 'Recebimento nota fiscal 12500'),
(4, 'SAIDA', 12000.000, '2026-07-30 10:00:00', 'Consumo producao'),
(5, 'ENTRADA', 50.000, '2026-06-17 08:00:00', 'Recebimento nota fiscal 12450'),
(5, 'SAIDA', 48000.000, '2026-07-18 14:00:00', 'Consumo producao'),
(7, 'SAIDA', 2100.000, '2026-07-20 15:00:00', 'Consumo producao'),
(8, 'ENTRADA', 75000.000, '2026-07-06 09:30:00', 'Recebimento nota fiscal 12750'),
(9, 'ENTRADA', 8000.000, '2026-05-12 09:00:00', 'Recebimento nota fiscal 12700'),
(9, 'SAIDA', 1150.000, '2026-07-28 08:00:00', 'Validade proxima, uso prioritario'),
(10, 'ENTRADA', 6000.000, '2026-06-12 08:30:00', 'Recebimento nota fiscal 12550'),
(11, 'ENTRADA', 200.000, '2026-06-12 08:35:00', 'Recebimento nota fiscal 12551'),
(12, 'ENTRADA', 4000.000, '2026-06-02 08:00:00', 'Recebimento nota fiscal 12400'),
(12, 'SAIDA', 500.000, '2026-07-05 09:00:00', 'Consumo producao'),
(13, 'ENTRADA', 5000.000, '2026-07-16 08:30:00', 'Recebimento nota fiscal 12800'),
(14, 'SAIDA', 4300.000, '2026-07-10 10:00:00', 'Consumo producao'),
(15, 'ENTRADA', 6000.000, '2026-07-03 09:00:00', 'Recebimento nota fiscal 12720'),
(17, 'ENTRADA', 6000.000, '2026-04-07 08:00:00', 'Recebimento nota fiscal 12200'),
(17, 'SAIDA', 1000.000, '2026-07-10 14:00:00', 'Consumo producao'),
(18, 'ENTRADA', 4000.000, '2026-07-22 09:00:00', 'Recebimento nota fiscal 12900'),
(19, 'ENTRADA', 8000.000, '2026-03-17 08:00:00', 'Recebimento nota fiscal 12100'),
(19, 'SAIDA', 1200.000, '2026-07-20 10:00:00', 'Consumo producao'),
(20, 'ENTRADA', 7000.000, '2026-06-27 08:30:00', 'Recebimento nota fiscal 12600'),
(21, 'ENTRADA', 3500.000, '2026-05-03 08:00:00', 'Recebimento nota fiscal 12300'),
(21, 'SAIDA', 400.000, '2026-07-08 15:00:00', 'Consumo producao'),
(22, 'ENTRADA', 60000.000, '2026-04-19 09:00:00', 'Recebimento nota fiscal 12250'),
(22, 'SAIDA', 32000.000, '2026-08-01 08:00:00', 'Consumo producao'),
(23, 'ENTRADA', 50000.000, '2026-07-11 09:30:00', 'Recebimento nota fiscal 12850'),
(25, 'ENTRADA', 800.000, '2026-06-03 08:00:00', 'Recebimento nota fiscal 12430'),
(25, 'SAIDA', 280.000, '2026-07-15 10:00:00', 'Consumo producao'),
(26, 'ENTRADA', 12.000, '2026-04-27 08:00:00', 'Recebimento nota fiscal 12220'),
(26, 'SAIDA', 3.500, '2026-07-18 09:00:00', 'Consumo producao'),
(27, 'ENTRADA', 600.000, '2026-05-17 08:30:00', 'Recebimento nota fiscal 12350'),
(27, 'SAIDA', 220.000, '2026-07-22 14:00:00', 'Consumo producao'),
(28, 'ENTRADA', 1200.000, '2026-06-12 09:00:00', 'Recebimento nota fiscal 12520'),
(28, 'SAIDA', 450.000, '2026-07-25 10:00:00', 'Consumo producao'),
(29, 'ENTRADA', 400.000, '2026-05-30 08:00:00', 'Recebimento nota fiscal 12380'),
(29, 'SAIDA', 150.000, '2026-07-28 09:00:00', 'Consumo producao'),
(6, 'ENTRADA', 40.000, '2026-07-22 08:00:00', 'Recebimento nota fiscal 12880');

-- ------------------------------------------------------------
-- PREVISOES DE CONSUMO (ago e set/2026)
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
(9, '2026-08-01', '2026-08-01', '2026-08-31', 1530.000, 87.80, 'sazonal'),
(11, '2026-08-01', '2026-08-01', '2026-08-31', 5100.000, 91.20, 'media_movel'),
(12, '2026-08-01', '2026-08-01', '2026-08-31', 7500.000, 93.80, 'media_movel'),
(13, '2026-08-01', '2026-08-01', '2026-08-31', 3050.000, 89.50, 'suavizacao_exponencial'),
(16, '2026-08-01', '2026-08-01', '2026-08-31', 680.000, 87.30, 'media_movel'),
(17, '2026-08-01', '2026-08-01', '2026-08-31', 12.500, 88.10, 'media_movel'),
(18, '2026-08-01', '2026-08-01', '2026-08-31', 500.000, 90.00, 'media_movel'),
(19, '2026-08-01', '2026-08-01', '2026-08-31', 1150.000, 89.20, 'suavizacao_exponencial'),
(20, '2026-08-01', '2026-08-01', '2026-08-31', 340.000, 86.50, 'sazonal'),
(1, '2026-09-01', '2026-09-01', '2026-09-30', 2380.000, 90.00, 'media_movel'),
(2, '2026-09-01', '2026-09-01', '2026-09-30', 4850.000, 88.50, 'media_movel'),
(3, '2026-09-01', '2026-09-01', '2026-09-30', 45.500, 87.00, 'media_movel'),
(4, '2026-09-01', '2026-09-01', '2026-09-30', 69000.000, 94.00, 'media_movel'),
(7, '2026-09-01', '2026-09-01', '2026-09-30', 3900.000, 89.50, 'media_movel'),
(8, '2026-09-01', '2026-09-01', '2026-09-30', 6100.000, 92.00, 'media_movel'),
(11, '2026-09-01', '2026-09-01', '2026-09-30', 5300.000, 89.80, 'suavizacao_exponencial'),
(12, '2026-09-01', '2026-09-01', '2026-09-30', 7700.000, 92.50, 'media_movel');

-- ------------------------------------------------------------
-- SUGESTOES DE COMPRA
-- ------------------------------------------------------------
INSERT INTO sugestoes_compra (materia_prima_id, data_sugestao, quantidade_sugerida, motivo, status) VALUES
(5, '2026-07-30', 20.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(7, '2026-07-30', 2000.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(8, '2026-07-30', 3000.000, 'Previsao de consumo elevada', 'PENDENTE'),
(9, '2026-07-31', 1500.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(10, '2026-07-31', 800.000, 'Formula inativa, compra suspensa', 'CANCELADA'),
(16, '2026-08-01', 500.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(17, '2026-08-01', 8.000, 'Consumo crescente, reposicao urgente', 'PENDENTE'),
(18, '2026-08-02', 400.000, 'Estoque critico, nivel 20%', 'PENDENTE'),
(19, '2026-08-02', 1000.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(20, '2026-08-03', 250.000, 'Estoque abaixo do minimo', 'PENDENTE'),
(1, '2026-08-05', 2000.000, 'Previsao setembro alto consumo', 'APROVADA'),
(12, '2026-08-05', 3000.000, 'Estoque em nivel minimo', 'APROVADA'),
(6, '2026-08-06', 200.000, 'Estoque abaixo do minimo, demanda sazonal', 'PENDENTE'),
(13, '2026-08-07', 1500.000, 'Estoque em nivel critico', 'PENDENTE'),
(11, '2026-08-08', 2000.000, 'Previsao de alta demanda', 'APROVADA');

-- ------------------------------------------------------------
-- COMPRAS
-- ------------------------------------------------------------
INSERT INTO compras (fornecedor_id, data_compra, previsao_entrega, data_recebimento, status) VALUES
(1, '2026-06-01', '2026-06-03', '2026-06-03', 'RECEBIDA'),
(2, '2026-07-05', '2026-07-15', '2026-07-15', 'RECEBIDA'),
(6, '2026-07-25', '2026-07-30', NULL, 'PENDENTE'),
(1, '2026-08-01', '2026-08-12', NULL, 'PENDENTE'),
(8, '2026-06-05', '2026-06-07', '2026-06-07', 'RECEBIDA'),
(3, '2026-05-28', '2026-06-01', '2026-06-01', 'RECEBIDA'),
(9, '2026-04-20', '2026-04-25', '2026-04-25', 'RECEBIDA'),
(10, '2026-05-25', '2026-05-27', '2026-05-27', 'RECEBIDA'),
(7, '2026-06-28', '2026-07-02', '2026-07-03', 'RECEBIDA'),
(4, '2026-07-01', '2026-07-03', '2026-07-06', 'RECEBIDA'),
(1, '2026-06-22', '2026-06-25', '2026-06-27', 'RECEBIDA'),
(3, '2026-07-18', '2026-07-22', NULL, 'PENDENTE'),
(8, '2026-08-03', '2026-08-05', NULL, 'PENDENTE'),
(7, '2026-08-05', '2026-08-08', NULL, 'PENDENTE'),
(9, '2026-08-06', '2026-08-10', NULL, 'PENDENTE');

INSERT INTO compra_itens (compra_id, materia_prima_id, quantidade, valor_unitario) VALUES
(1, 1, 2500.000, 0.95),
(1, 7, 4000.000, 0.08),
(2, 6, 300.000, 15.20),
(2, 8, 8000.000, 0.045),
(3, 3, 50.000, 28.50),
(4, 7, 3500.000, 0.075),
(5, 11, 6000.000, 0.12),
(5, 12, 8000.000, 0.065),
(6, 16, 800.000, 8.50),
(6, 17, 12.000, 35.00),
(7, 15, 30.000, 12.80),
(8, 16, 800.000, 8.50),
(9, 8, 6000.000, 0.043),
(9, 18, 600.000, 2.10),
(10, 4, 75000.000, 0.0058),
(10, 14, 50000.000, 0.0068),
(11, 12, 7000.000, 0.063),
(11, 13, 3500.000, 0.35),
(12, 17, 12.000, 35.00),
(13, 11, 4000.000, 0.118),
(14, 19, 1200.000, 1.80),
(15, 20, 400.000, 4.50);

-- ------------------------------------------------------------
-- ALERTAS
-- ------------------------------------------------------------
INSERT INTO alertas (tipo, materia_prima_id, lote_id, descricao, prioridade, resolvido, data_alerta) VALUES
('ESTOQUE_MINIMO', 5, NULL, 'Vaselina solida abaixo do estoque minimo', 'ALTA', FALSE, '2026-07-30 09:00:00'),
('ESTOQUE_MINIMO', 7, NULL, 'Dipirona sodica abaixo do estoque minimo', 'ALTA', FALSE, '2026-07-30 09:05:00'),
('ESTOQUE_MINIMO', 9, NULL, 'Alcachofra abaixo do estoque minimo (formula inativa)', 'MEDIA', FALSE, '2026-07-30 09:10:00'),
('ESTOQUE_MINIMO', 10, NULL, 'Glucomanano abaixo do estoque minimo (formula inativa)', 'MEDIA', FALSE, '2026-07-30 09:15:00'),
('VENCIMENTO', NULL, 10, 'Lote LOT-ALC-001 com validade proxima', 'MEDIA', FALSE, '2026-07-31 08:00:00'),
('VENCIMENTO', NULL, 8, 'Lote LOT-VIT-001 com validade proxima', 'MEDIA', FALSE, '2026-07-31 08:00:00'),
('VENCIMENTO', NULL, 6, 'Lote LOT-BET-001 com validade proxima', 'BAIXA', FALSE, '2026-07-31 08:00:00'),
('VENCIMENTO', NULL, 17, 'Lote LOT-IBU-001 com validade proxima', 'BAIXA', TRUE, '2026-08-01 08:00:00'),
('REPOSICAO', NULL, NULL, 'Nova remessa de omeprazol aguardando recebimento', 'BAIXA', TRUE, '2026-08-01 10:00:00'),
('ESTOQUE_MINIMO', 16, NULL, 'Acido hialuronico abaixo do estoque minimo', 'ALTA', FALSE, '2026-08-02 09:00:00'),
('ESTOQUE_MINIMO', 18, NULL, 'Zinco picolinato abaixo do estoque minimo', 'ALTA', FALSE, '2026-08-02 09:05:00'),
('ESTOQUE_MINIMO', 19, NULL, 'Magnesio quelado abaixo do estoque minimo', 'ALTA', FALSE, '2026-08-03 09:00:00'),
('ESTOQUE_MINIMO', 20, NULL, 'Melatonina abaixo do estoque minimo', 'MEDIA', FALSE, '2026-08-03 09:05:00'),
('VENCIMENTO', NULL, 1, 'Lote LOT-OME-001 com validade proxima', 'BAIXA', TRUE, '2026-08-05 08:00:00'),
('REPOSICAO', NULL, NULL, 'Compra de dipirona aprovada, aguardando entrega', 'BAIXA', FALSE, '2026-08-06 10:00:00'),
('ESTOQUE_MINIMO', 17, NULL, 'Colageno hidrolisado abaixo do estoque minimo', 'ALTA', FALSE, '2026-08-07 09:00:00'),
('VENCIMENTO', NULL, 21, 'Lote LOT-AMO-001 com validade proxima', 'MEDIA', FALSE, '2026-08-08 08:00:00'),
('REPOSICAO', NULL, NULL, 'Compra de acido hialuronico pendente aprovacao', 'BAIXA', FALSE, '2026-08-09 10:00:00');
