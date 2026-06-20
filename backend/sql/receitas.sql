CREATE TABLE receitas (
    id_medicamento INT,
    id_usuario INT,
    confianca_extracao_ia FLOAT,
    dosagem TEXT,
    frequencia TEXT,
    horarios TEXT,
    dias_semana TEXT,
    duracao_dias INT,
    data_fim DATE,
    qnt INT,
    via_administracao TEXT,
    uso_continuo BOOLEAN,
    observacoes TEXT
);