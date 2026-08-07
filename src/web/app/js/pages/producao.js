async function renderProducao() {
    const res = await API.listarOrdens();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="ordemForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>`;
    html += renderTable(
        ["ID", "Pedido ID", "Inicio", "Fim", "Status"],
        data.map(o => [o.id, o.pedido_id || "-", o.data_inicio || "-", o.data_fim || "-",
            `<span class="badge ${statusBadge(o.status)}">${o.status}</span>`]),
        r => `<div class="text-nowrap">
            <button class="btn btn-sm btn-outline-info me-1" onclick="ordemForm(${r[0]})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-success me-1" onclick="iniciarOrdem(${r[0]})"><i class="bi bi-play-fill"></i></button>
            <button class="btn btn-sm btn-outline-primary me-1" onclick="finalizarOrdem(${r[0]})"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-sm btn-outline-warning me-1" onclick="cancelarOrdem(${r[0]})"><i class="bi bi-x-lg"></i></button>
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="consumirOrdem(${r[0]})"><i class="bi bi-arrow-down"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="ordemDelete(${r[0]})"><i class="bi bi-trash"></i></button>
        </div>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.ordemForm = async function (id) {
    let o = { pedido_id: "", status: "PENDENTE" };
    if (id) { const r = await API.buscarOrdem(id); if (r.ok && r.data) o = r.data; }
    showModal(id ? "Editar Ordem" : "Nova Ordem",
        formGroup("Pedido ID", "f-ped", "number", o.pedido_id || "") +
        selGroup("Status", "f-status", [
            { value: "PENDENTE", label: "Pendente" }, { value: "EM_PRODUCAO", label: "Em Producao" },
            { value: "FINALIZADA", label: "Finalizada" }, { value: "CANCELADA", label: "Cancelada" }
        ], o.status),
        async function () {
            const d = { pedido_id: val("f-ped") ? Number(val("f-ped")) : null, status: val("f-status") };
            if (id) await API.atualizarOrdem(id, d); else await API.criarOrdem(d);
            closeModal(); renderProducao();
        }
    );
};

window.ordemDelete = async function (id) { if (confirm("Deletar ordem?")) { await API.deletarOrdem(id); renderProducao(); } };
window.iniciarOrdem = async function (id) { if (confirm("Iniciar producao?")) { await API.iniciarOrdem(id); renderProducao(); } };
window.finalizarOrdem = async function (id) { if (confirm("Finalizar producao?")) { await API.finalizarOrdem(id); renderProducao(); } };
window.cancelarOrdem = async function (id) { if (confirm("Cancelar ordem?")) { await API.cancelarOrdem(id); renderProducao(); } };

window.consumirOrdem = async function (id) {
    showModal("Registrar Consumo - Ordem #" + id,
        formGroup("Lote ID", "f-lote", "number", "") +
        formGroup("Quantidade", "f-qtd", "number", ""),
        async function () {
            const d = { lote_id: Number(val("f-lote")), quantidade: Number(val("f-qtd")) };
            const res = await API.registrarConsumo(id, d);
            if (!res.ok) alert("Erro: " + res.data);
            else { closeModal(); renderProducao(); }
        }
    );
};
