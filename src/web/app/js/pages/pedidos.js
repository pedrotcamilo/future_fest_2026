async function renderPedidos() {
    const [res, cliRes] = await Promise.all([
        API.listarPedidos(),
        API.listarClientes()
    ]);
    const data = res.ok ? res.data : [];
    const clientes = cliRes.ok ? cliRes.data : [];
    const nomeCliente = id => {
        const c = clientes.find(x => x.id === id);
        return c ? c.nome : "-";
    };
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="pedidoForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>
    </div>`;
    html += tituloTabela("Pedidos") + renderTable(
        ["ID", "Cliente", "Data Pedido", "Status", "Data Entrega"],
        data.map(p => [p.id, nomeCliente(p.cliente_id), p.data_pedido,
            `<span class="badge ${statusBadge(p.status)}">${p.status}</span>`,
            p.data_entrega || "-"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="pedidoForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-warning me-1" onclick="verItensPedido(${r[0]})"><i class="bi bi-list-ul"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="pedidoDelete(${r[0]})"><i class="bi bi-trash"></i></button>`,
        { chave: "pedidos", ocultar: [0] }
    );
    document.getElementById("content-body").innerHTML = html;
}

window.pedidoForm = async function (id) {
    let p = { cliente_id: "", status: "PENDENTE", data_entrega: "" };
    if (id) { const r = await API.buscarPedido(id); if (r.ok && r.data) p = r.data; }
    const cliRes = await API.listarClientes();
    const clientes = cliRes.ok ? cliRes.data : [];
    showModal(id ? "Editar Pedido" : "Novo Pedido",
        selGroup("Cliente", "f-cli",
            opcoesSelect(clientes, c => c.id, c => c.nome, "Selecione o cliente"),
            p.cliente_id || "") +
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
    const [res, fRes] = await Promise.all([
        API.buscarPedido(id),
        API.listarFormulas()
    ]);
    const pedido = res.ok ? res.data : {};
    const formulas = fRes.ok ? fRes.data : [];
    const nomeFormula = fid => {
        const f = formulas.find(x => x.id === fid);
        if (!f) return "Formula " + fid;
        return (f.codigo || ("Formula " + f.id)) + (f.descricao ? " · " + f.descricao : "");
    };
    const itens = pedido.itens || [];
    let rows = itens.map(i => `<tr><td>${nomeFormula(i.formula_id)}</td><td>${i.quantidade}</td></tr>`).join("");
    showModal("Itens do Pedido #" + id,
        `<button class="btn btn-sm btn-primary mb-2" onclick="adicionarItensPedido(${id})"><i class="bi bi-plus-lg"></i> Adicionar</button>
        <div class="table-wrap"><table class="table table-sm">
        <thead><tr><th>Formula</th><th>Quantidade</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2" class="text-center text-muted">Nenhum item</td></tr>'}</tbody></table></div>`,
        null
    );
};

window.adicionarItensPedido = async function (pedidoId) {
    const fRes = await API.listarFormulas();
    const formulas = fRes.ok ? fRes.data : [];
    showModal("Adicionar Item ao Pedido",
        selGroup("Formula", "f-fml",
            opcoesSelect(formulas,
                f => f.id,
                f => (f.codigo || ("Formula " + f.id)) + (f.descricao ? " · " + f.descricao : ""),
                "Selecione a formula"),
            "") +
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
