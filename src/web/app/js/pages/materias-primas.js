async function renderMateriasPrimas() {
    const params = new URLSearchParams();
    const fnome = document.getElementById("filtro-mp-nome")?.value;
    const fbaixo = document.getElementById("filtro-mp-baixo")?.value;
    const fvenc = document.getElementById("filtro-mp-venc")?.value;
    if (fnome) params.set("nome", fnome);
    if (fbaixo) params.set("estoqueBaixo", fbaixo);
    if (fvenc) params.set("vencendo", fvenc);
    const res = await API.listarMateriasPrimas(params.toString());
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="mpForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" placeholder="Nome" id="filtro-mp-nome" value="${fnome||""}">
        <select class="form-select form-select-sm" id="filtro-mp-baixo"><option value="">Todos</option>
            <option value="true" ${fbaixo=="true"?"selected":""}>Estoque Baixo</option></select>
        <select class="form-select form-select-sm" id="filtro-mp-venc"><option value="">Todos</option>
            <option value="true" ${fvenc=="true"?"selected":""}>Vencendo</option></select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderMateriasPrimas()">Filtrar</button>
    </div>`;
    html += renderTable(
        ["ID", "Codigo", "Nome", "Unidade", "Estoque Min", "Estoque Max", "Cons Medio", "Ativo"],
        data.map(m => [m.id, m.codigo || "-", m.nome, m.unidade || "-", m.estoque_minimo || "-", m.estoque_maximo || "-", m.consumo_medio_mensal || "-", m.ativo ? "Sim" : "Nao"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="mpForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="mpDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.mpForm = async function (id) {
    let m = { codigo: "", nome: "", unidade: "", estoque_minimo: "", estoque_maximo: "", consumo_medio_mensal: "", ativo: true };
    if (id) { const r = await API.buscarMateriaPrima(id); if (r.ok && r.data) m = r.data; }
    showModal(id ? "Editar Materia-Prima" : "Nova Materia-Prima",
        formGroup("Codigo", "f-codigo", "text", m.codigo || "") +
        formGroup("Nome", "f-nome", "text", m.nome || "") +
        formGroup("Unidade", "f-unidade", "text", m.unidade || "") +
        formGroup("Estoque Minimo", "f-min", "number", m.estoque_minimo || "") +
        formGroup("Estoque Maximo", "f-max", "number", m.estoque_maximo || "") +
        formGroup("Consumo Medio Mensal", "f-consumo", "number", m.consumo_medio_mensal || "") +
        selGroup("Ativo", "f-ativo", [{ value: "true", label: "Sim" }, { value: "false", label: "Nao" }], m.ativo ? "true" : "false"),
        async function () {
            const d = { codigo: val("f-codigo"), nome: val("f-nome"), unidade: val("f-unidade"), estoque_minimo: val("f-min") ? Number(val("f-min")) : null, estoque_maximo: val("f-max") ? Number(val("f-max")) : null, consumo_medio_mensal: val("f-consumo") ? Number(val("f-consumo")) : null, ativo: val("f-ativo") === "true" };
            if (id) await API.atualizarMateriaPrima(id, d); else await API.criarMateriaPrima(d);
            closeModal(); renderMateriasPrimas();
        }
    );
};

window.mpDelete = async function (id) { if (confirm("Deletar materia-prima?")) { await API.deletarMateriaPrima(id); renderMateriasPrimas(); } };
