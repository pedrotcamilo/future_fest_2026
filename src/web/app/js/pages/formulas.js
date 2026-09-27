async function renderFormulas() {
    const res = await API.listarFormulas();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="formulaForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>`;
    html += tituloTabela("Formulas") + renderTable(["ID", "Codigo", "Descricao", "Categoria", "Ativa"],
        data.map(f => [f.id, f.codigo || "-", f.descricao || "-", f.categoria || "-", f.ativa ? "Sim" : "Nao"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="formulaForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-warning me-1" onclick="verItensFormula(${r[0]})"><i class="bi bi-list-ul"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="formulaDelete(${r[0]})"><i class="bi bi-trash"></i></button>`,
        { chave: "formulas", ocultar: [0] }
    );
    document.getElementById("content-body").innerHTML = html;
}

window.formulaForm = async function (id) {
    let f = { codigo: "", descricao: "", categoria: "", ativa: true };
    if (id) { const r = await API.buscarFormula(id); if (r.ok && r.data) f = r.data; }
    showModal(id ? "Editar Formula" : "Nova Formula",
        formGroup("Codigo", "f-codigo", "text", f.codigo || "") +
        formGroup("Descricao", "f-desc", "text", f.descricao || "") +
        formGroup("Categoria", "f-cat", "text", f.categoria || "") +
        selGroup("Ativa", "f-ativa", [{ value: "true", label: "Sim" }, { value: "false", label: "Nao" }], f.ativa ? "true" : "false"),
        async function () {
            const d = { codigo: val("f-codigo"), descricao: val("f-desc"), categoria: val("f-cat"), ativa: val("f-ativa") === "true" };
            if (id) await API.atualizarFormula(id, d); else await API.criarFormula(d);
            closeModal(); renderFormulas();
        }
    );
};

window.formulaDelete = async function (id) { if (confirm("Deletar formula?")) { await API.deletarFormula(id); renderFormulas(); } };

window.verItensFormula = async function (id) {
    const [res, mpRes] = await Promise.all([
        API.listarItensFormula(id),
        API.listarMateriasPrimas()
    ]);
    const itens = res.ok ? res.data : [];
    const materias = mpRes.ok ? mpRes.data : [];
    const nomeMateria = mpId => {
        const m = materias.find(x => x.id === mpId);
        if (!m) return "Materia-prima " + mpId;
        return m.codigo ? `${m.nome} (${m.codigo})` : m.nome;
    };
    let rows = itens.map(i => `<tr><td>${nomeMateria(i.materia_prima_id)}</td><td>${i.quantidade}</td><td>${i.unidade || "-"}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="delItemFormula(${id},${i.id})"><i class="bi bi-trash"></i></button></td></tr>`).join("");
    showModal("Itens da Formula",
        `<button class="btn btn-sm btn-primary mb-2" onclick="addItemFormula(${id})"><i class="bi bi-plus-lg"></i> Adicionar</button>
        <div class="table-wrap"><table class="table table-sm">
        <thead><tr><th>Materia-Prima</th><th>Quantidade</th><th>Unidade</th><th>Acao</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="text-center text-muted">Nenhum item</td></tr>'}</tbody></table></div>`,
        null
    );
};

window.addItemFormula = async function (formulaId) {
    const mpRes = await API.listarMateriasPrimas();
    const materias = mpRes.ok ? mpRes.data : [];
    showModal("Adicionar Item",
        selGroup("Materia-Prima", "f-mp",
            opcoesSelect(materias,
                m => m.id,
                m => m.codigo ? `${m.nome} (${m.codigo})` : m.nome,
                "Selecione a materia-prima"),
            "") +
        formGroup("Quantidade", "f-qtd", "number", "") +
        formGroup("Unidade", "f-und", "text", ""),
        async function () {
            const d = { materia_prima_id: Number(val("f-mp")), quantidade: Number(val("f-qtd")), unidade: val("f-und") };
            await API.adicionarItemFormula(formulaId, d);
            closeModal(); verItensFormula(formulaId);
        }
    );
};

window.delItemFormula = async function (formulaId, itemId) {
    if (confirm("Deletar item?")) { await API.deletarItemFormula(formulaId, itemId); verItensFormula(formulaId); }
};
