async function renderClientes() {
    const res = await API.listarClientes();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="clienteForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>
    </div>`;
    html += renderTable(["ID", "Nome", "Telefone", "Email"],
        data.map(c => [c.id, c.nome, c.telefone || "-", c.email || "-"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="clienteForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="clienteDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.clienteForm = async function (id) {
    let c = { nome: "", telefone: "", email: "" };
    if (id) { const r = await API.buscarCliente(id); if (r.ok && r.data) c = r.data; }
    showModal(id ? "Editar Cliente" : "Novo Cliente",
        formGroup("Nome", "f-nome", "text", c.nome) +
        formGroup("Telefone", "f-tel", "text", c.telefone || "") +
        formGroup("Email", "f-email", "email", c.email || ""),
        async function () {
            const d = { nome: val("f-nome"), telefone: val("f-tel"), email: val("f-email") };
            if (id) await API.atualizarCliente(id, d); else await API.criarCliente(d);
            closeModal(); renderClientes();
        }
    );
};

window.clienteDelete = async function (id) { if (confirm("Deletar cliente?")) { await API.deletarCliente(id); renderClientes(); } };
