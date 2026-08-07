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
