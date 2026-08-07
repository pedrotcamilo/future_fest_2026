async function renderCompras() {
    const res = await API.listarCompras();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="compraForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>`;
    html += renderTable(
        ["ID", "Fornecedor ID", "Data", "Previsao Entrega", "Recebimento", "Status"],
        data.map(c => [c.id, c.fornecedor_id, c.data_compra, c.previsao_entrega || "-", c.data_recebimento || "-",
            `<span class="badge ${statusBadge(c.status)}">${c.status}</span>`]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="compraForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-success me-1" onclick="receberCompra(${r[0]})"><i class="bi bi-check-lg"></i></button>
              <button class="btn btn-sm btn-outline-warning me-1" onclick="cancelarCompra(${r[0]})"><i class="bi bi-x-lg"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="compraDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.compraForm = async function (id) {
    let c = { fornecedor_id: "", data_compra: "", previsao_entrega: "", status: "PENDENTE" };
    if (id) { const r = await API.buscarCompra(id); if (r.ok && r.data) c = r.data; }
    showModal(id ? "Editar Compra" : "Nova Compra",
        formGroup("Fornecedor ID", "f-forn", "number", c.fornecedor_id) +
        formGroup("Data Compra", "f-data", "date", c.data_compra || "") +
        formGroup("Previsao Entrega", "f-prev", "date", c.previsao_entrega || "") +
        selGroup("Status", "f-status", [
            { value: "PENDENTE", label: "Pendente" }, { value: "RECEBIDA", label: "Recebida" }, { value: "CANCELADA", label: "Cancelada" }
        ], c.status),
        async function () {
            const d = { fornecedor_id: Number(val("f-forn")), data_compra: val("f-data") || null, previsao_entrega: val("f-prev") || null, status: val("f-status") };
            if (id) await API.atualizarCompra(id, d); else {
                const cr = await API.criarCompra(d);
                if (cr.ok && cr.data && cr.data.id) {
                    const compraId = cr.data.id;
                    closeModal();
                    await adicionarItensCompra(compraId);
                    return;
                }
            }
            closeModal(); renderCompras();
        }
    );
};

window.adicionarItensCompra = async function (compraId) {
    showModal("Adicionar Item a Compra #" + compraId,
        formGroup("Materia-Prima ID", "f-mp", "number", "") +
        formGroup("Quantidade", "f-qtd", "number", "") +
        formGroup("Valor Unitario", "f-vlr", "number", ""),
        async function () {
            const d = { materia_prima_id: Number(val("f-mp")), quantidade: Number(val("f-qtd")), valor_unitario: val("f-vlr") ? Number(val("f-vlr")) : null };
            await API.adicionarItemCompra(compraId, d);
            if (confirm("Item adicionado! Adicionar mais itens?")) {
                adicionarItensCompra(compraId);
            } else {
                closeModal();
                renderCompras();
            }
        }
    );
};

window.compraDelete = async function (id) { if (confirm("Deletar compra?")) { await API.deletarCompra(id); renderCompras(); } };
window.receberCompra = async function (id) { if (confirm("Receber compra?")) { await API.receberCompra(id); renderCompras(); } };
window.cancelarCompra = async function (id) { if (confirm("Cancelar compra?")) { await API.cancelarCompra(id); renderCompras(); } };
