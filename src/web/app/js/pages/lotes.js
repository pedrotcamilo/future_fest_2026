async function renderLotes() {
    destruirGraficos();
    const params = new URLSearchParams();
    const fvenc = document.getElementById("filtro-lote-venc")?.value;
    const fmp = document.getElementById("filtro-lote-mp")?.value;
    const fforn = document.getElementById("filtro-lote-forn")?.value;
    if (fvenc) params.set("vencimento", fvenc);
    if (fmp) params.set("materiaPrima", fmp);
    if (fforn) params.set("fornecedor", fforn);
    const res = await API.listarLotes(params.toString());
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="loteForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>
    </div>
    <div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-lotes-top", icone: "bi-stack", label: "Top 15 por quantidade atual",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${data.length} lotes</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-lotes-faixas", icone: "bi-calendar-event", label: "Lotes por faixa de validade", badge: ""
        })}</div>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" style="width:140px" placeholder="Dias vencimento" id="filtro-lote-venc" value="${fvenc||""}">
        <input class="form-control form-control-sm" style="width:120px" placeholder="MP ID" id="filtro-lote-mp" value="${fmp||""}">
        <input class="form-control form-control-sm" style="width:120px" placeholder="Fornecedor ID" id="filtro-lote-forn" value="${fforn||""}">
        <button class="btn btn-sm btn-outline-secondary" onclick="renderLotes()">Filtrar</button>
    </div>`;
    html += renderTable(
        ["ID", "MP ID", "Fornecedor ID", "Numero Lote", "Qtd Inicial", "Qtd Atual", "Fabricacao", "Validade", "Valor Unit."],
        data.map(l => [l.id, l.materia_prima_id, l.fornecedor_id || "-", l.numero_lote || "-", l.quantidade_inicial, l.quantidade_atual, l.data_fabricacao || "-", l.data_validade || "-", l.valor_unitario || "-"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="loteForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="loteDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;

    /* Top 15 lotes com maior saldo (respeita os filtros do servidor). */
    const top = data
        .filter(l => l.quantidade_atual != null)
        .map(l => ({ rotulo: l.numero_lote || ("Lote " + l.id), v: Number(l.quantidade_atual) || 0 }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 15);
    criarGraficoBarra("graf-lotes-top", {
        titulo: "Lotes com maior quantidade atual",
        categorias: top.map(t => t.rotulo),
        series: [{ name: "Quantidade", data: top.map(t => t.v), color: "#3b82f6" }],
        altura: alturaGraficoBarra(Math.max(top.length, 1))
    });

    const faixas = faixasDeValidade(data);
    criarGraficoBarra("graf-lotes-faixas", {
        titulo: "Vencidos / ate 30 / 31 a 90 / mais de 90 dias",
        categorias: faixas.rotulos,
        series: [{ name: "Lotes", data: faixas.valores, color: "#3b82f6" }],
        distribuido: true,
        coresDistribuidas: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
        altura: 300,
        rotacionar: false
    });
}

window.loteForm = async function (id) {
    let l = { materia_prima_id: "", fornecedor_id: "", numero_lote: "", quantidade_inicial: "", quantidade_atual: "", data_fabricacao: "", data_validade: "", data_recebimento: "", valor_unitario: "" };
    if (id) { const r = await API.buscarLote(id); if (r.ok && r.data) l = r.data; }
    showModal(id ? "Editar Lote" : "Novo Lote",
        formGroup("Materia-Prima ID", "f-mp", "number", l.materia_prima_id) +
        formGroup("Fornecedor ID", "f-forn", "number", l.fornecedor_id || "") +
        formGroup("Numero Lote", "f-num", "text", l.numero_lote || "") +
        formGroup("Quantidade Inicial", "f-qtd-ini", "number", l.quantidade_inicial || "") +
        formGroup("Quantidade Atual", "f-qtd-atual", "number", l.quantidade_atual || "") +
        formGroup("Data Fabricacao", "f-fab", "date", l.data_fabricacao || "") +
        formGroup("Data Validade", "f-val", "date", l.data_validade || "") +
        formGroup("Data Recebimento", "f-rec", "date", l.data_recebimento || "") +
        formGroup("Valor Unitario", "f-vlr", "number", l.valor_unitario || ""),
        async function () {
            const d = { materia_prima_id: Number(val("f-mp")), fornecedor_id: val("f-forn") ? Number(val("f-forn")) : null, numero_lote: val("f-num"), quantidade_inicial: val("f-qtd-ini") ? Number(val("f-qtd-ini")) : null, quantidade_atual: val("f-qtd-atual") ? Number(val("f-qtd-atual")) : null, data_fabricacao: val("f-fab") || null, data_validade: val("f-val") || null, data_recebimento: val("f-rec") || null, valor_unitario: val("f-vlr") ? Number(val("f-vlr")) : null };
            if (id) await API.atualizarLote(id, d); else await API.criarLote(d);
            closeModal(); renderLotes();
        }
    );
};

window.loteDelete = async function (id) { if (confirm("Deletar lote?")) { await API.deletarLote(id); renderLotes(); } };
