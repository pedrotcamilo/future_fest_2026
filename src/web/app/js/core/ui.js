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

function statusBadge(s) {
    const m = { PENDENTE: "badge-pendente", RECEBIDA: "badge-recebida", CANCELADA: "badge-cancelada" };
    return m[s] || "bg-secondary";
}
