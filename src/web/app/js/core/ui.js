let modalInstance = null;

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

/* ───────────────── Listas com "Ver mais" ─────────────────
   Todas as tabelas do site passam por renderTable, entao a paginacao
   visual e feita aqui (client-side): os dados completos ficam em LISTAS
   e apenas a fatia visivel e desenhada. Clicar em "Ver mais"/"Ver menos"
   reescreve somente o container da tabela — sem nova chamada de API e sem
   destruir os graficos da pagina.

   - chave: identifica a tabela entre re-renders (identica na mesma tela).
   - passo: quantas linhas mostrar inicialmente e por clique (padrao 15).
   - o limite persiste enquanto o usuario esta na pagina e zera quando ele
     troca de tela (app.js chama resetListas() no navigateTo). */
const LISTAS = {};
const PASSO_LISTA_PADRAO = 15;

/* Renderiza a parte da lista referente ao limite atual. */
function desenharLista(chave) {
    const estado = LISTAS[chave];
    if (!estado) return "";
    const { headers, rows, actions, limite } = estado;
    const visiveis = rows.slice(0, limite);

    const h = headers.map(x => `<th>${x}</th>`).join("");
    const r = visiveis.map(row => {
        const cells = row.map(c => `<td>${c}</td>`).join("");
        return `<tr>${cells}${actions ? `<td class="text-nowrap">${actions(row)}</td>` : ""}</tr>`;
    }).join("");

    let rodape = "";
    const podeMais = rows.length > visiveis.length;
    /* So merece rodape se ha linhas escondidas ou se a lista foi expandida
       (ai o "Ver menos" devolve ao tamanho padrao). */
    const expandida = visiveis.length > estado.passo;
    if (podeMais || expandida) {
        const contagem = `Mostrando ${visiveis.length} de ${rows.length} registros`;
        rodape = `<div class="lista-rodape">
            <span class="lista-contador">${contagem}</span>
            <div class="lista-acoes">
                ${expandida ? `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="listaVerMenos('${chave}')"><i class="bi bi-chevron-up"></i> Ver menos</button>` : ""}
                ${podeMais ? `<button type="button" class="btn btn-sm btn-outline-primary" onclick="listaVerMais('${chave}')"><i class="bi bi-chevron-down"></i> Ver mais</button>` : ""}
            </div>
        </div>`;
    }

    return `<div class="table-wrap"><table class="table table-dark table-hover table-striped mb-0">
        <thead><tr>${h}${actions ? "<th>Acoes</th>" : ""}</tr></thead><tbody>${r}</tbody></table></div>${rodape}`;
}

function redesenharLista(chave) {
    const el = document.getElementById("lista-" + chave);
    if (el) el.innerHTML = desenharLista(chave);
}

window.listaVerMais = function (chave) {
    const estado = LISTAS[chave];
    if (!estado) return;
    estado.limite = Math.min(estado.limite + estado.passo, estado.rows.length);
    redesenharLista(chave);
};

window.listaVerMenos = function (chave) {
    const estado = LISTAS[chave];
    if (!estado) return;
    estado.limite = estado.passo;
    redesenharLista(chave);
    document.getElementById("lista-" + chave)?.scrollIntoView({ block: "start", behavior: "smooth" });
};

/* Chamado no navigateTo: cada tela comeca com o limite padrao. */
function resetListas() {
    Object.keys(LISTAS).forEach(k => delete LISTAS[k]);
}

/* Titulo acima das tabelas: uma classe unica (.titulo-tabela no app.css)
   para o tamanho ser o mesmo em todas as telas. */
function tituloTabela(texto) {
    return `<h6 class="titulo-tabela mb-2">${texto}</h6>`;
}

function renderTable(headers, rows, actions, opcoes) {
    if (!rows.length) return '<p class="text-muted text-center py-3">Nenhum registro encontrado.</p>';
    const o = opcoes || {};
    /* Sem chave explicita, deriva dos cabecalhos (unicos por tabela na tela)
       e remove caracteres que nao servem de id de elemento. */
    const chave = o.chave ||
        ("tb-" + headers.join("-").replace(/[^A-Za-z0-9_-]+/g, "-"));
    const passo = o.passo || PASSO_LISTA_PADRAO;
    const anterior = LISTAS[chave];
    LISTAS[chave] = {
        headers,
        rows,
        actions,
        passo,
        /* Mantem o nivel de expansao entre re-renders da mesma tela
           (filtro/edicao/exclusao), limitado ao total atual. */
        limite: anterior
            ? Math.max(passo, Math.min(anterior.limite, rows.length))
            : Math.min(passo, rows.length)
    };
    return `<div id="lista-${chave}" class="lista">${desenharLista(chave)}</div>`;
}

function statusBadge(s) {
    const m = { PENDENTE: "badge-pendente", RECEBIDA: "badge-recebida", CANCELADA: "badge-cancelada" };
    return m[s] || "bg-secondary";
}
