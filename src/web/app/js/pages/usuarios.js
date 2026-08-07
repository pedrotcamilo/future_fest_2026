async function renderUsuarios() {
    const res = await API.listarUsuarios();
    const data = res.ok ? res.data : [];
    const isAdmin = currentUser && currentUser.admin;
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>`;
    if (isAdmin) {
        html += `<button class="btn btn-primary btn-sm" onclick="usuarioForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>`;
    }
    html += `</div>`;
    html += renderTable(
        ["ID", "Nome", "Email", "Telefone", "Admin"],
        data.map(u => [u.id, u.nome, u.email, u.telefone || "-", u.admin ? "Sim" : "Nao"]),
        isAdmin
            ? r => `<button class="btn btn-sm btn-outline-info me-1" onclick="usuarioForm(${r[0]})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="usuarioDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
            : null
    );
    document.getElementById("content-body").innerHTML = html;
}

window.usuarioForm = async function (id) {
    let u = { nome: "", telefone: "", email: "", senha: "" };
    if (id) { const r = await API.buscarUsuario(id); if (r.ok && r.data.length) u = r.data[0]; }
    const isEdit = !!id;
    showModal(isEdit ? "Editar Usuario" : "Novo Usuario",
        formGroup("Nome", "f-nome", "text", u.nome) +
        formGroup("Telefone", "f-telefone", "text", u.telefone || "") +
        formGroup("Email", "f-email", "email", u.email) +
        (!isEdit ? formGroup("Senha", "f-senha", "password", "") : ""),
        async function () {
            const d = { nome: val("f-nome"), telefone: val("f-telefone"), email: val("f-email") };
            if (!isEdit) d.senha = val("f-senha");
            if (isEdit) await API.atualizarUsuario(id, d);
            else await API.criarUsuario(d);
            closeModal();
            renderUsuarios();
        }
    );
};

window.usuarioDelete = async function (id) {
    if (confirm("Deletar usuario?")) { await API.deletarUsuario(id); renderUsuarios(); }
};
