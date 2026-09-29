async function renderProducao() {
    destruirGraficos();
    const fstatus = document.getElementById("filtro-prod-status")?.value || "";
    const [res, pedRes, cliRes] = await Promise.all([
        API.listarOrdens(),
        API.listarPedidos(),
        API.listarClientes()
    ]);
    const data = res.ok ? res.data : [];
    const pedidos = pedRes.ok ? pedRes.data : [];
    const clientes = cliRes.ok ? cliRes.data : [];
    /* Nome do cliente dono do pedido da ordem (no lugar do pedido_id). */
    const clienteDoPedido = pedidoId => {
        const p = pedidos.find(x => x.id === pedidoId);
        if (!p) return "-";
        const c = clientes.find(x => x.id === p.cliente_id);
        return c ? c.nome : "-";
    };
    /* Opcoes do filtro geradas dos dados reais (nao dependem de enums fixos). */
    const statuses = [...new Set(data.map(o => o.status).filter(Boolean))].sort();
    const visiveis = fstatus ? data.filter(o => o.status === fstatus) : data;

    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="ordemForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>
    <div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-prod-status", icone: "bi-gear-wide-connected", label: "Ordens por status",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${visiveis.length} ordens</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-prod-mes", label: "Ordens iniciadas por mes", badge: ""
        })}</div>
    </div>
    <div class="filters-bar">
        <select class="form-select form-select-sm" style="max-width:200px" id="filtro-prod-status">
            <option value="">Todos os status</option>
            ${statuses.map(s => `<option value="${s}" ${fstatus == s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderProducao()">Filtrar</button>
    </div>`;
    html += tituloTabela("Ordens de producao") + renderTable(
        ["ID", "Cliente", "Inicio", "Fim", "Status"],
        visiveis.map(o => [o.id, clienteDoPedido(o.pedido_id), o.data_inicio || "-", o.data_fim || "-",
            `<span class="badge ${statusBadge(o.status)}">${o.status}</span>`]),
        r => `<div class="text-nowrap">
            <button class="btn btn-sm btn-outline-info me-1" onclick="ordemForm(${r[0]})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-success me-1" onclick="iniciarOrdem(${r[0]})"><i class="bi bi-play-fill"></i></button>
            <button class="btn btn-sm btn-outline-primary me-1" onclick="finalizarOrdem(${r[0]})"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-sm btn-outline-warning me-1" onclick="cancelarOrdem(${r[0]})"><i class="bi bi-x-lg"></i></button>
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="consumirOrdem(${r[0]})"><i class="bi bi-arrow-down"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="ordemDelete(${r[0]})"><i class="bi bi-trash"></i></button>
        </div>`,
        { chave: "producao", ocultar: [0] }
    );
    document.getElementById("content-body").innerHTML = html;

    const agrupado = agruparPorCampo(visiveis, "status");
    criarGraficoDonut("graf-prod-status", {
        titulo: "Ordens de producao por status",
        rotulos: agrupado.rotulos,
        valores: agrupado.valores
    });

    const porMes = new Map();
    visiveis.forEach(o => {
        if (!o.data_inicio) return;
        const m = String(o.data_inicio).slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) porMes.set(m, (porMes.get(m) || 0) + 1);
    });
    const meses = [...porMes.keys()].sort();
    criarGraficoLinha("graf-prod-mes", {
        titulo: "Ordens iniciadas por mes",
        categorias: meses,
        series: [{ name: "Ordens", data: meses.map(m => porMes.get(m)), color: "#3b82f6" }]
    });
}

window.ordemForm = async function (id) {
    let o = { pedido_id: "", status: "PENDENTE" };
    if (id) { const r = await API.buscarOrdem(id); if (r.ok && r.data) o = r.data; }
    const [pedRes, cliRes] = await Promise.all([
        API.listarPedidos(),
        API.listarClientes()
    ]);
    const pedidos = pedRes.ok ? pedRes.data : [];
    const clientes = cliRes.ok ? cliRes.data : [];
    const clienteDe = cid => {
        const c = clientes.find(x => x.id === cid);
        return c ? c.nome : "";
    };
    showModal(id ? "Editar Ordem" : "Nova Ordem",
        selGroup("Pedido", "f-ped",
            opcoesSelect(pedidos,
                p => p.id,
                p => `Pedido #${p.id} — ${clienteDe(p.cliente_id) || "sem cliente"}`,
                "Selecione o pedido"),
            o.pedido_id || "") +
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
    const lRes = await API.listarLotes();
    const lotes = lRes.ok ? lRes.data : [];
    showModal("Registrar Consumo - Ordem #" + id,
        selGroup("Lote", "f-lote",
            opcoesSelect(lotes,
                l => l.id,
                l => l.numero_lote || ("Lote " + l.id),
                "Selecione o lote"),
            "") +
        formGroup("Quantidade", "f-qtd", "number", ""),
        async function () {
            const d = { lote_id: Number(val("f-lote")), quantidade: Number(val("f-qtd")) };
            const res = await API.registrarConsumo(id, d);
            if (res.ok) { closeModal(); renderProducao(); }
        }
    );
};
