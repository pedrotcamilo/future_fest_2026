async function renderPedidos() {
    const res = await API.listarPedidos();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="pedidoForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>
    </div>`;
    html += renderTable(
        ["ID", "Cliente ID", "Data Pedido", "Status", "Data Entrega"],
        data.map(p => [p.id, p.cliente_id, p.data_pedido,
            `<span class="badge ${statusBadge(p.status)}">${p.status}</span>`,
            p.data_entrega || "-"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="pedidoForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-warning me-1" onclick="verItensPedido(${r[0]})"><i class="bi bi-list-ul"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="pedidoDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.pedidoForm = async function (id) {
    let p = { cliente_id: "", status: "PENDENTE", data_entrega: "" };
    if (id) { const r = await API.buscarPedido(id); if (r.ok && r.data) p = r.data; }
    showModal(id ? "Editar Pedido" : "Novo Pedido",
        formGroup("Cliente ID", "f-cli", "number", p.cliente_id) +
        selGroup("Status", "f-status", [
            { value: "PENDENTE", label: "Pendente" }, { value: "EM_PRODUCAO", label: "Em Producao" },
            { value: "FINALIZADO", label: "Finalizado" }, { value: "CANCELADO", label: "Cancelado" }
        ], p.status) +
        formGroup("Data Entrega", "f-entrega", "date", p.data_entrega || ""),
        async function () {
            const d = { cliente_id: Number(val("f-cli")), status: val("f-status"), data_entrega: val("f-entrega") || null };
            if (id) await API.atualizarPedido(id, d); else {
                const cr = await API.criarPedido(d);
                if (cr.ok && cr.data && cr.data.id) {
                    closeModal();
                    await adicionarItensPedido(cr.data.id);
                    return;
                }
            }
            closeModal(); renderPedidos();
        }
    );
};

window.verItensPedido = async function (id) {
    const res = await API.buscarPedido(id);
    const pedido = res.ok ? res.data : {};
    const itens = pedido.itens || [];
    let rows = itens.map(i => `<tr><td>${i.id}</td><td>${i.formula_id}</td><td>${i.quantidade}</td></tr>`).join("");
    showModal("Itens do Pedido #" + id,
        `<button class="btn btn-sm btn-primary mb-2" onclick="adicionarItensPedido(${id})"><i class="bi bi-plus-lg"></i> Adicionar</button>
        <div class="table-wrap"><table class="table table-dark table-sm">
        <thead><tr><th>ID</th><th>Formula ID</th><th>Quantidade</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" class="text-center text-muted">Nenhum item</td></tr>'}</tbody></table></div>`,
        null
    );
};

window.adicionarItensPedido = async function (pedidoId) {
    showModal("Adicionar Item ao Pedido",
        formGroup("Formula ID", "f-fml", "number", "") +
        formGroup("Quantidade", "f-qtd", "number", ""),
        async function () {
            const d = { formula_id: Number(val("f-fml")), quantidade: Number(val("f-qtd")) };
            await API.adicionarItemPedido(pedidoId, d);
            if (confirm("Item adicionado! Adicionar mais?")) adicionarItensPedido(pedidoId);
            else { closeModal(); renderPedidos(); }
        }
    );
};

window.pedidoDelete = async function (id) { if (confirm("Deletar pedido?")) { await API.deletarPedido(id); renderPedidos(); } };
