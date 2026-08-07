async function renderEstoque() {
    const [eRes, mRes] = await Promise.all([API.consultarEstoque(), API.listarMovimentacoes()]);
    const estoque = eRes.ok ? eRes.data : [];
    const movs = mRes.ok ? mRes.data : [];
    document.getElementById("content-body").innerHTML = `
    <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-estq">Estoque</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-mov">Movimentacoes</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-mov-nova">Nova Movimentacao</a></li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-estq">
            ${renderTable(["MP ID", "Nome", "Estoque"], estoque.map(e => [e.materia_prima_id, e.nome, e.estoque]))}
        </div>
        <div class="tab-pane fade" id="tab-mov">
            ${renderTable(["ID", "Lote ID", "Tipo", "Quantidade", "Data", "Observacao"],
                movs.map(m => [m.id, m.lote_id, m.tipo, m.quantidade, m.data_movimento, m.observacao || "-"]))}
        </div>
        <div class="tab-pane fade" id="tab-mov-nova">
            <div class="card-dash p-3" style="max-width:500px">
                ${formGroup("Lote ID", "f-lote", "number", "")}
                <div class="mb-3"><label class="form-label">Tipo</label>
                    <select class="form-select" id="f-tipo"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saida</option></select></div>
                ${formGroup("Quantidade", "f-qtd", "number", "")}
                ${formGroup("Observacao", "f-obs", "text", "")}
                <button class="btn btn-primary" onclick="registrarMov()">Registrar</button>
                <div id="mov-msg" class="mt-2 small"></div>
            </div>
        </div>
    </div>`;
}

window.registrarMov = async function () {
    const d = { loteId: Number(val("f-lote")), tipo: val("f-tipo"), quantidade: Number(val("f-qtd")), observacao: val("f-obs") };
    const res = await API.registrarMovimentacao(d);
    document.getElementById("mov-msg").textContent = res.ok ? "Movimentacao registrada!" : "Erro: " + res.data;
    if (res.ok) setTimeout(renderEstoque, 1000);
};
