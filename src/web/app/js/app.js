let modalInstance = null;
let currentUser = null;

/* ==============================
   TIMEOUT DE INATIVIDADE (1 min)
   ============================== */
const TIMEOUT_INATIVIDADE_MS = 60 * 1000;
const AVISO_INATIVIDADE_MS = 30 * 1000;
let ultimaAtividade = Date.now();
let avisoAtivo = false;

function criarAvisoInatividade() {
    const overlay = document.createElement("div");
    overlay.id = "aviso-inatividade";
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:none;align-items:center;justify-content:center;flex-direction:column;text-align:center;";
    overlay.innerHTML = `<i class="bi bi-hourglass-split" style="font-size:4rem;color:#ffc107"></i>
        <h3 class="mt-3 text-white">Sessao inativa</h3>
        <p class="text-body-secondary">Movimente o mouse ou pressione uma tecla para continuar.</p>
        <div class="spinner-border text-warning" role="status"></div>`;
    document.body.appendChild(overlay);
    return overlay;
}

function mostrarAvisoInatividade() {
    if (avisoAtivo) return;
    avisoAtivo = true;
    const overlay = document.getElementById("aviso-inatividade") || criarAvisoInatividade();
    overlay.style.display = "flex";
}

function ocultarAvisoInatividade() {
    if (!avisoAtivo) return;
    avisoAtivo = false;
    const overlay = document.getElementById("aviso-inatividade");
    if (overlay) overlay.style.display = "none";
}

function reiniciarTimerInatividade() {
    ultimaAtividade = Date.now();
    ocultarAvisoInatividade();
}

async function deslogarPorInatividade() {
    try { await API.logout(); } catch (e) {}
    localStorage.removeItem("token");
    window.location.href = "/web/login";
}

function verificarInatividade() {
    const inativo = Date.now() - ultimaAtividade;
    if (inativo >= TIMEOUT_INATIVIDADE_MS) {
        deslogarPorInatividade();
    } else if (inativo >= AVISO_INATIVIDADE_MS) {
        mostrarAvisoInatividade();
    }
}

["mousemove", "keydown", "click", "scroll", "touchstart", "wheel"].forEach(evt =>
    document.addEventListener(evt, reiniciarTimerInatividade, { passive: true })
);

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) verificarInatividade();
});

setInterval(verificarInatividade, 1000);

window.onload = async function () {
    if (!API.getToken()) { window.location.href = "/web/login"; return; }

    const me = await API.me();
    if (me.ok) {
        currentUser = me.data;
        const greeting = document.getElementById("header-greeting");
        if (greeting) greeting.textContent = "Olá, " + currentUser.nome;
    }
    if (me.ok && !currentUser.admin) {
        const navUsuarios = document.getElementById("nav-usuarios");
        if (navUsuarios) navUsuarios.style.display = "none";
    }

    document.querySelectorAll("[data-page]").forEach(a => {
        a.addEventListener("click", function (e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });

    document.getElementById("btn-logout").addEventListener("click", async function (e) {
        e.preventDefault();
        await API.logout();
        localStorage.removeItem("token");
        window.location.href = "/web/login";
    });

    document.getElementById("btn-toggle-sidebar").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("open");
    });

    navigateTo("dashboard");
};

async function navigateTo(page) {
    document.querySelectorAll(".nav-item[data-page]").forEach(a => {
        a.classList.toggle("active", a.dataset.page === page);
    });
    document.getElementById("sidebar").classList.remove("open");

    const titles = {
        dashboard: "Dashboard", usuarios: "Usuarios", fornecedores: "Fornecedores",
        "materias-primas": "Materias-Primas", lotes: "Lotes", clientes: "Clientes",
        formulas: "Formulas", estoque: "Estoque", compras: "Compras",
        pedidos: "Pedidos", producao: "Producao", consumo: "Historico de Consumo",
        previsoes: "Previsoes de Consumo", sugestoes: "Sugestoes de Compra",
        alertas: "Alertas", relatorios: "Relatorios"
    };
    document.getElementById("page-title").textContent = titles[page] || page;

    document.getElementById("content-body").innerHTML =
        '<div class="text-center py-5"><div class="spinner-border"></div></div>';

    const renderers = {
        dashboard: renderDashboard,
        usuarios: renderUsuarios,
        fornecedores: renderFornecedores,
        "materias-primas": renderMateriasPrimas,
        lotes: renderLotes,
        clientes: renderClientes,
        formulas: renderFormulas,
        estoque: renderEstoque,
        compras: renderCompras,
        pedidos: renderPedidos,
        producao: renderProducao,
        consumo: renderConsumo,
        previsoes: renderPrevisoes,
        sugestoes: renderSugestoes,
        alertas: renderAlertas,
        relatorios: renderRelatorios,
    };

    if (renderers[page]) await renderers[page]();
    else document.getElementById("content-body").innerHTML = "<h3>Pagina nao encontrada</h3>";
}

function showModal(title, bodyHtml, saveCallback) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = bodyHtml;
    const saveBtn = document.getElementById("btn-modal-save");
    const newBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newBtn, saveBtn);
    if (saveCallback) newBtn.addEventListener("click", saveCallback);
    if (!modalInstance) modalInstance = new bootstrap.Modal(document.getElementById("modal-form"));
    modalInstance.show();
}

function closeModal() { if (modalInstance) modalInstance.hide(); }

function formGroup(label, id, type = "text", value = "", extra = "") {
    return `<div class="mb-3"><label class="form-label">${label}</label>
        <input type="${type}" class="form-control" id="${id}" value="${value}" ${extra}></div>`;
}

function selGroup(label, id, options, selected = "") {
    let opts = options.map(o =>
        `<option value="${o.value}" ${o.value == selected ? "selected" : ""}>${o.label}</option>`
    ).join("");
    return `<div class="mb-3"><label class="form-label">${label}</label>
        <select class="form-select" id="${id}">${opts}</select></div>`;
}

function val(id) { return (document.getElementById(id) || {}).value || ""; }

function renderTable(headers, rows, actions) {
    if (!rows.length) return '<p class="text-muted text-center py-3">Nenhum registro encontrado.</p>';
    let h = headers.map(h => `<th>${h}</th>`).join("");
    let r = rows.map(row => {
        let cells = row.map(c => `<td>${c}</td>`).join("");
        return `<tr>${cells}${actions ? `<td class="text-nowrap">${actions(row)}</td>` : ""}</tr>`;
    }).join("");
    return `<div class="table-wrap"><table class="table table-dark table-hover table-striped mb-0">
        <thead><tr>${h}${actions ? "<th>Acoes</th>" : ""}</tr></thead><tbody>${r}</tbody></table></div>`;
}

/* ==============================
   DASHBOARD
   ============================== */
async function renderDashboard() {
    const [res, estq, comp, prod, prevs, alrt] = await Promise.all([
        API.dashboard(), API.dashboardEstoque(), API.dashboardCompras(),
        API.dashboardProducao(), API.dashboardPrevisoes(), API.dashboardAlertas()
    ]);
    const d = res.ok ? res.data : {};
    let html = `<div class="row g-3 mb-4">
        <div class="col-md-3"><div class="card-dash text-center"><div class="icon bi bi-capsule text-info"></div>
            <div class="number">${d.total_materias_primas || 0}</div><div class="label">Materias-Primas</div></div></div>
        <div class="col-md-3"><div class="card-dash text-center"><div class="icon bi bi-cart3 text-warning"></div>
            <div class="number">${d.compras_pendentes || 0}</div><div class="label">Compras Pendentes</div></div></div>
        <div class="col-md-3"><div class="card-dash text-center"><div class="icon bi bi-gear-wide-connected text-primary"></div>
            <div class="number">${d.ordens_em_producao || 0}</div><div class="label">Em Producao</div></div></div>
        <div class="col-md-3"><div class="card-dash text-center"><div class="icon bi bi-exclamation-triangle text-danger"></div>
            <div class="number">${d.alertas_ativos || 0}</div><div class="label">Alertas Ativos</div></div></div>
    </div>`;

    if (estq.ok && estq.data.length) {
        html += `<h6 class="mb-2">Estoque Atual</h6>${renderTable(
            ["Materia-Prima", "Estoque"],
            estq.data.map(i => [i.nome, i.estoque])
        )}`;
    }
    document.getElementById("content-body").innerHTML = html;
}

/* ==============================
   USUARIOS
   ============================== */
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

/* ==============================
   FORNECEDORES
   ============================== */
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

/* ==============================
   MATERIAS-PRIMAS
   ============================== */
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

/* ==============================
   LOTES
   ============================== */
async function renderLotes() {
    const params = new URLSearchParams();
    const fvenc = document.getElementById("filtro-lote-venc")?.value;
    const fmp = document.getElementById("filtro-lote-mp")?.value;
    const fforn = document.getElementById("filtro-lote-forn")?.value;
    if (fvenc) params.set("vencimento", fvenc);
    if (fmp) params.set("materiaPrima", fmp);
    if (fforn) params.set("fornecedor", fforn);
    const res = await API.listarLotes(params.toString());
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="loteForm(null)"><i class="bi bi-plus-lg"></i> Novo</button>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" style="width:140px" placeholder="Dias vencimento" id="filtro-lote-venc" value="${fvenc||""}">
        <input class="form-control form-control-sm" style="width:120px" placeholder="MP ID" id="filtro-lote-mp" value="${fmp||""}">
        <input class="form-control form-control-sm" style="width:120px" placeholder="Fornecedor ID" id="filtro-lote-forn" value="${fforn||""}">
        <button class="btn btn-sm btn-outline-secondary" onclick="renderLotes()">Filtrar</button>
    </div>`;
    html += renderTable(
        ["ID", "MP ID", "Fornecedor ID", "Numero Lote", "Qtd Inicial", "Qtd Atual", "Fabricacao", "Validade", "Valor Unit."],
        data.map(l => [l.id, l.materia_prima_id, l.fornecedor_id || "-", l.numero_lote || "-", l.quantidade_inicial, l.quantidade_atual, l.data_fabricacao || "-", l.data_validade || "-", l.valor_unitario || "-"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="loteForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="loteDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.loteForm = async function (id) {
    let l = { materia_prima_id: "", fornecedor_id: "", numero_lote: "", quantidade_inicial: "", quantidade_atual: "", data_fabricacao: "", data_validade: "", data_recebimento: "", valor_unitario: "" };
    if (id) { const r = await API.buscarLote(id); if (r.ok && r.data) l = r.data; }
    showModal(id ? "Editar Lote" : "Novo Lote",
        formGroup("Materia-Prima ID", "f-mp", "number", l.materia_prima_id) +
        formGroup("Fornecedor ID", "f-forn", "number", l.fornecedor_id || "") +
        formGroup("Numero Lote", "f-num", "text", l.numero_lote || "") +
        formGroup("Quantidade Inicial", "f-qtd-ini", "number", l.quantidade_inicial || "") +
        formGroup("Quantidade Atual", "f-qtd-atual", "number", l.quantidade_atual || "") +
        formGroup("Data Fabricacao", "f-fab", "date", l.data_fabricacao || "") +
        formGroup("Data Validade", "f-val", "date", l.data_validade || "") +
        formGroup("Data Recebimento", "f-rec", "date", l.data_recebimento || "") +
        formGroup("Valor Unitario", "f-vlr", "number", l.valor_unitario || ""),
        async function () {
            const d = { materia_prima_id: Number(val("f-mp")), fornecedor_id: val("f-forn") ? Number(val("f-forn")) : null, numero_lote: val("f-num"), quantidade_inicial: val("f-qtd-ini") ? Number(val("f-qtd-ini")) : null, quantidade_atual: val("f-qtd-atual") ? Number(val("f-qtd-atual")) : null, data_fabricacao: val("f-fab") || null, data_validade: val("f-val") || null, data_recebimento: val("f-rec") || null, valor_unitario: val("f-vlr") ? Number(val("f-vlr")) : null };
            if (id) await API.atualizarLote(id, d); else await API.criarLote(d);
            closeModal(); renderLotes();
        }
    );
};

window.loteDelete = async function (id) { if (confirm("Deletar lote?")) { await API.deletarLote(id); renderLotes(); } };

/* ==============================
   CLIENTES
   ============================== */
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

/* ==============================
   FORMULAS
   ============================== */
async function renderFormulas() {
    const res = await API.listarFormulas();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="formulaForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>`;
    html += renderTable(["ID", "Codigo", "Descricao", "Categoria", "Ativa"],
        data.map(f => [f.id, f.codigo || "-", f.descricao || "-", f.categoria || "-", f.ativa ? "Sim" : "Nao"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="formulaForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-warning me-1" onclick="verItensFormula(${r[0]})"><i class="bi bi-list-ul"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="formulaDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
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
    const res = await API.listarItensFormula(id);
    const itens = res.ok ? res.data : [];
    let rows = itens.map(i => `<tr><td>${i.id}</td><td>${i.materia_prima_id}</td><td>${i.quantidade}</td><td>${i.unidade || "-"}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="delItemFormula(${id},${i.id})"><i class="bi bi-trash"></i></button></td></tr>`).join("");
    showModal("Itens da Formula",
        `<button class="btn btn-sm btn-primary mb-2" onclick="addItemFormula(${id})"><i class="bi bi-plus-lg"></i> Adicionar</button>
        <div class="table-wrap"><table class="table table-dark table-sm">
        <thead><tr><th>ID</th><th>MP ID</th><th>Quantidade</th><th>Unidade</th><th>Acao</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">Nenhum item</td></tr>'}</tbody></table></div>`,
        null
    );
};

window.addItemFormula = async function (formulaId) {
    showModal("Adicionar Item",
        formGroup("Materia-Prima ID", "f-mp", "number", "") +
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

/* ==============================
   ESTOQUE
   ============================== */
async function renderEstoque() {
    const [eRes, mRes] = await Promise.all([API.consultarEstoque(), API.listarMovimentacoes()]);
    const estoque = eRes.ok ? eRes.data : [];
    const movs = mRes.ok ? mRes.data : [];
    document.getElementById("content-body").innerHTML = `
    <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-estq">Estoque</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-mov">Movimentacoes</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-mov-nova">Nova Movimentacao</a></li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-estq">
            ${renderTable(["MP ID", "Nome", "Estoque"], estoque.map(e => [e.materia_prima_id, e.nome, e.estoque]))}
        </div>
        <div class="tab-pane fade" id="tab-mov">
            ${renderTable(["ID", "Lote ID", "Tipo", "Quantidade", "Data", "Observacao"],
                movs.map(m => [m.id, m.lote_id, m.tipo, m.quantidade, m.data_movimento, m.observacao || "-"]))}
        </div>
        <div class="tab-pane fade" id="tab-mov-nova">
            <div class="card-dash p-3" style="max-width:500px">
                ${formGroup("Lote ID", "f-lote", "number", "")}
                <div class="mb-3"><label class="form-label">Tipo</label>
                    <select class="form-select" id="f-tipo"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saida</option></select></div>
                ${formGroup("Quantidade", "f-qtd", "number", "")}
                ${formGroup("Observacao", "f-obs", "text", "")}
                <button class="btn btn-primary" onclick="registrarMov()">Registrar</button>
                <div id="mov-msg" class="mt-2 small"></div>
            </div>
        </div>
    </div>`;
}

window.registrarMov = async function () {
    const d = { loteId: Number(val("f-lote")), tipo: val("f-tipo"), quantidade: Number(val("f-qtd")), observacao: val("f-obs") };
    const res = await API.registrarMovimentacao(d);
    document.getElementById("mov-msg").textContent = res.ok ? "Movimentacao registrada!" : "Erro: " + res.data;
    if (res.ok) setTimeout(renderEstoque, 1000);
};

/* ==============================
   COMPRAS
   ============================== */
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

function statusBadge(s) {
    const m = { PENDENTE: "badge-pendente", RECEBIDA: "badge-recebida", CANCELADA: "badge-cancelada" };
    return m[s] || "bg-secondary";
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

/* ==============================
   PEDIDOS
   ============================== */
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

/* ==============================
   PRODUCAO
   ============================== */
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

/* ==============================
   CONSUMO
   ============================== */
async function renderConsumo() {
    const params = new URLSearchParams();
    const finicio = document.getElementById("filtro-cons-inicio")?.value;
    const ffim = document.getElementById("filtro-cons-fim")?.value;
    const fmp = document.getElementById("filtro-cons-mp")?.value;
    if (finicio) params.set("inicio", finicio);
    if (ffim) params.set("fim", ffim);
    if (fmp) params.set("materiaPrima", fmp);
    const res = await API.listarConsumos(params.toString());
    const data = res.ok ? res.data : [];
    let html = `
    <div class="filters-bar">
        <input class="form-control form-control-sm" type="date" id="filtro-cons-inicio" value="${finicio||""}">
        <input class="form-control form-control-sm" type="date" id="filtro-cons-fim" value="${ffim||""}">
        <input class="form-control form-control-sm" style="width:120px" placeholder="MP ID" id="filtro-cons-mp" value="${fmp||""}">
        <button class="btn btn-sm btn-outline-secondary" onclick="renderConsumo()">Filtrar</button>
    </div>`;
    html += renderTable(["ID", "Materia-Prima ID", "Data", "Quantidade"],
        data.map(c => [c.id, c.materia_prima_id, c.data, c.quantidade]));
    document.getElementById("content-body").innerHTML = html;
}

/* ==============================
   PREVISOES
   ============================== */
async function renderPrevisoes() {
    const [res, mpList] = await Promise.all([
        API.listarPrevisoes(),
        API.listarMateriasPrimas()
    ]);
    const data = res.ok ? res.data : [];
    const materias = mpList.ok ? mpList.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="previsaoForm()"><i class="bi bi-plus-lg"></i> Nova Previsao</button>
    </div>`;
    html += renderTable(
        ["ID", "MP ID", "Data Previsao", "Periodo", "Consumo Previsto", "Confianca", "Modelo"],
        data.map(p => [p.id, p.materia_prima_id, p.data_previsao,
            `${p.periodo_inicio} a ${p.periodo_fim}`,
            p.consumo_previsto, p.confianca ? p.confianca + "%" : "-", p.modelo_utilizado || "-"
        ])
    );
    document.getElementById("content-body").innerHTML = html;
}

window.previsaoForm = function () {
    showModal("Gerar Previsao",
        formGroup("Materia-Prima ID", "f-mp", "number", "") +
        formGroup("Inicio Periodo", "f-inicio", "date", "") +
        formGroup("Fim Periodo", "f-fim", "date", "") +
        formGroup("Consumo Previsto", "f-consumo", "number", "") +
        formGroup("Confianca (%)", "f-conf", "number", "") +
        formGroup("Modelo", "f-modelo", "text", "MEDIA_MOVEL"),
        async function () {
            const d = { materia_prima_id: Number(val("f-mp")), periodo_inicio: val("f-inicio"), periodo_fim: val("f-fim"), consumo_previsto: Number(val("f-consumo")), confianca: val("f-conf") ? Number(val("f-conf")) : null, modelo_utilizado: val("f-modelo") };
            await API.gerarPrevisao(d);
            closeModal(); renderPrevisoes();
        }
    );
};

/* ==============================
   SUGESTOES
   ============================== */
async function renderSugestoes() {
    const res = await API.listarSugestoes();
    const data = res.ok ? res.data : [];
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-warning btn-sm" onclick="gerarSugestoes()"><i class="bi bi-magic"></i> Gerar Sugestoes</button>
    </div>`;
    html += renderTable(
        ["ID", "MP ID", "Data", "Qtd Sugerida", "Motivo", "Status"],
        data.map(s => [s.id, s.materia_prima_id, s.data_sugestao, s.quantidade_sugerida, s.motivo || "-",
            `<span class="badge ${statusBadge(s.status)}">${s.status}</span>`]),
        r => `<button class="btn btn-sm btn-outline-success me-1" onclick="aprovarSugestao(${r[0]})"><i class="bi bi-check-lg"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="rejeitarSugestao(${r[0]})"><i class="bi bi-x-lg"></i></button>`
    );
    document.getElementById("content-body").innerHTML = html;
}

window.gerarSugestoes = async function () {
    const res = await API.gerarSugestoes();
    alert(res.ok ? res.data : "Erro ao gerar sugestoes");
    renderSugestoes();
};
window.aprovarSugestao = async function (id) { await API.aprovarSugestao(id); renderSugestoes(); };
window.rejeitarSugestao = async function (id) { await API.rejeitarSugestao(id); renderSugestoes(); };

/* ==============================
   ALERTAS
   ============================== */
async function renderAlertas() {
    const params = new URLSearchParams();
    const ftipo = document.getElementById("filtro-alerta-tipo")?.value;
    const fprio = document.getElementById("filtro-alerta-prio")?.value;
    const fres = document.getElementById("filtro-alerta-res")?.value;
    if (ftipo) params.set("tipo", ftipo);
    if (fprio) params.set("prioridade", fprio);
    if (fres) params.set("resolvido", fres);
    const res = await API.listarAlertas(params.toString());
    const data = res.ok ? res.data : [];
    let html = `
    <div class="filters-bar">
        <select class="form-select form-select-sm" id="filtro-alerta-tipo">
            <option value="">Todos tipos</option><option value="VALIDADE" ${ftipo=="VALIDADE"?"selected":""}>Validade</option>
            <option value="ESTOQUE" ${ftipo=="ESTOQUE"?"selected":""}>Estoque</option>
        </select>
        <select class="form-select form-select-sm" id="filtro-alerta-prio">
            <option value="">Todas prioridades</option><option value="ALTA" ${fprio=="ALTA"?"selected":""}>Alta</option>
            <option value="MEDIA" ${fprio=="MEDIA"?"selected":""}>Media</option>
            <option value="BAIXA" ${fprio=="BAIXA"?"selected":""}>Baixa</option>
        </select>
        <select class="form-select form-select-sm" id="filtro-alerta-res">
            <option value="">Todos</option><option value="false" ${fres=="false"?"selected":""}>Nao Resolvidos</option>
            <option value="true" ${fres=="true"?"selected":""}>Resolvidos</option>
        </select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderAlertas()">Filtrar</button>
    </div>`;
    html += renderTable(
        ["ID", "Tipo", "MP ID", "Lote ID", "Descricao", "Prioridade", "Resolvido", "Data"],
        data.map(a => [a.id, a.tipo, a.materia_prima_id || "-", a.lote_id || "-", a.descricao || "-",
            `<span class="badge ${a.prioridade == "ALTA" ? "bg-danger" : a.prioridade == "MEDIA" ? "bg-warning text-dark" : "bg-secondary"}">${a.prioridade}</span>`,
            a.resolvido ? "Sim" : "Nao", a.data_alerta]),
        r => !r[6] || r[6] === "Nao" ? `<button class="btn btn-sm btn-outline-success" onclick="resolverAlerta(${r[0]})"><i class="bi bi-check-lg"></i> Resolver</button>` : ""
    );
    document.getElementById("content-body").innerHTML = html;
}

window.resolverAlerta = async function (id) { await API.resolverAlerta(id); renderAlertas(); };

/* ==============================
   RELATORIOS
   ============================== */
async function renderRelatorios() {
    document.getElementById("content-body").innerHTML = `
    <h5 class="mb-3">Relatorios</h5>
    <div class="row g-3">
        <div class="col-md-4">
            <div class="card-dash" onclick="verRelatorio('consumo')" style="cursor:pointer">
                <div class="icon bi bi-graph-down text-info"></div>
                <div class="fw-bold">Consumo</div>
                <div class="label small">Consumo por materia-prima</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card-dash" onclick="verRelatorio('estoque')" style="cursor:pointer">
                <div class="icon bi bi-box-seam text-primary"></div>
                <div class="fw-bold">Estoque</div>
                <div class="label small">Saldo atual de materias-primas</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card-dash" onclick="verRelatorio('vencimentos')" style="cursor:pointer">
                <div class="icon bi bi-calendar-x text-warning"></div>
                <div class="fw-bold">Vencimentos</div>
                <div class="label small">Lotes proximos ao vencimento</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card-dash" onclick="verRelatorio('compras')" style="cursor:pointer">
                <div class="icon bi bi-cart3 text-success"></div>
                <div class="fw-bold">Compras</div>
                <div class="label small">Historico de compras</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card-dash" onclick="verRelatorio('producao')" style="cursor:pointer">
                <div class="icon bi bi-gear-wide-connected text-info"></div>
                <div class="fw-bold">Producao</div>
                <div class="label small">Ordens de producao realizadas</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card-dash" onclick="verRelatorio('previsoes')" style="cursor:pointer">
                <div class="icon bi bi-graph-up text-purple" style="color:#a78bfa"></div>
                <div class="fw-bold">Previsoes</div>
                <div class="label small">Previsoes de consumo geradas</div>
            </div>
        </div>
    </div>`;
}

window.verRelatorio = async function (tipo) {
    const params = new URLSearchParams();
    const apiCalls = {
        consumo: API.relatorioConsumo,
        estoque: API.relatorioEstoque,
        vencimentos: API.relatorioVencimentos,
        compras: API.relatorioCompras,
        producao: API.relatorioProducao,
        previsoes: API.relatorioPrevisoes
    };
    if (tipo === "consumo" || tipo === "compras" || tipo === "producao") {
        const inicio = prompt("Data inicio (YYYY-MM-DD):") || "";
        const fim = prompt("Data fim (YYYY-MM-DD):") || "";
        if (inicio) params.set("inicio", inicio);
        if (fim) params.set("fim", fim);
    }
    const fn = apiCalls[tipo];
    if (!fn) return;
    const res = await fn(params.toString());
    const data = res.ok ? res.data : [];

    const headers = {
        consumo: ["MP ID", "Nome", "Unidade", "Total Consumido"],
        estoque: ["MP ID", "Nome", "Unidade", "Estoque Atual"],
        vencimentos: ["Nome", "Lote", "Validade", "Quantidade"],
        compras: ["ID", "Fornecedor", "Data", "Status"],
        producao: ["ID", "Pedido", "Inicio", "Fim", "Status"],
        previsoes: ["MP ID", "Nome", "Periodo", "Consumo Previsto", "Confianca"]
    };
    const cols = {
        consumo: d => [d.materia_prima_id, d.nome, d.unidade, d.total_consumido],
        estoque: d => [d.materia_prima_id, d.nome, d.unidade, d.estoque_atual],
        vencimentos: d => [d.nome, d.numero_lote, d.data_validade, d.quantidade_atual],
        compras: d => [d.id, d.fornecedor_id, d.data_compra, d.status],
        producao: d => [d.id, d.pedido_id, d.data_inicio || "-", d.data_fim || "-", d.status],
        previsoes: d => [d.materia_prima_id, d.nome, `${d.periodo_inicio} a ${d.periodo_fim}`, d.consumo_previsto, d.confianca || "-"]
    };

    let html = `<button class="btn btn-outline-secondary btn-sm mb-3" onclick="renderRelatorios()"><i class="bi bi-arrow-left"></i> Voltar</button>
    <h5 class="mb-3">Relatorio: ${tipo}</h5>`;
    html += renderTable(headers[tipo] || [], data.map(cols[tipo] || (d => Object.values(d))));
    document.getElementById("content-body").innerHTML = html;
};
