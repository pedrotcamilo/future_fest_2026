async function renderFornecedores() {
    const params = new URLSearchParams();
    const fnome = document.getElementById("filtro-nome")?.value;
    const fativo = document.getElementById("filtro-ativo")?.value;
    if (fnome) params.set("nome", fnome);
    if (fativo) params.set("ativo", fativo);
    const res = await API.listarFornecedores(params.toString());
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="fornForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" placeholder="Nome" id="filtro-nome" value="${fnome||""}">
        <select class="form-select form-select-sm" id="filtro-ativo">
            <option value="">Todos</option><option value="true" ${fativo=="true"?"selected":""}>Ativo</option>
            <option value="false" ${fativo=="false"?"selected":""}>Inativo</option>
        </select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderFornecedores()">Filtrar</button>
    </div>`;
    html += renderTable(
        ["ID", "Razao Social", "Fantasia", "CNPJ", "Telefone", "Email", "Prazo Entrega", "Ativo"],
        data.map(f => [f.id, f.razao_social, f.nome_fantasia || "-", f.cnpj || "-", f.telefone || "-", f.email || "-", f.prazo_entrega_dias || "-", f.ativo ? "Sim" : "Nao"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="fornForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="fornDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.fornForm = async function (id) {
    let f = { razao_social: "", nome_fantasia: "", cnpj: "", telefone: "", email: "", prazo_entrega_dias: "", ativo: true };
    if (id) { const r = await API.buscarFornecedor(id); if (r.ok && r.data) f = r.data; }
    showModal(id ? "Editar Fornecedor" : "Novo Fornecedor",
        formGroup("Razao Social", "f-razao", "text", f.razao_social) +
        formGroup("Nome Fantasia", "f-fantasia", "text", f.nome_fantasia || "") +
        formGroup("CNPJ", "f-cnpj", "text", f.cnpj || "") +
        formGroup("Telefone", "f-tel", "text", f.telefone || "") +
        formGroup("Email", "f-email", "email", f.email || "") +
        formGroup("Prazo Entrega (dias)", "f-prazo", "number", f.prazo_entrega_dias || "") +
        selGroup("Ativo", "f-ativo", [{ value: "true", label: "Sim" }, { value: "false", label: "Nao" }], f.ativo ? "true" : "false"),
        async function () {
            const d = { razao_social: val("f-razao"), nome_fantasia: val("f-fantasia"), cnpj: val("f-cnpj"), telefone: val("f-tel"), email: val("f-email"), prazo_entrega_dias: val("f-prazo") ? Number(val("f-prazo")) : null, ativo: val("f-ativo") === "true" };
            if (id) await API.atualizarFornecedor(id, d); else await API.criarFornecedor(d);
            closeModal(); renderFornecedores();
        }
    );
};

window.fornDelete = async function (id) { if (confirm("Deletar fornecedor?")) { await API.deletarFornecedor(id); renderFornecedores(); } };
