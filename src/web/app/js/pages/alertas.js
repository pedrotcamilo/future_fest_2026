async function renderAlertas() {
    destruirGraficos();
    const params = new URLSearchParams();
    const ftipo = document.getElementById("filtro-alerta-tipo")?.value;
    const fprio = document.getElementById("filtro-alerta-prio")?.value;
    const fres = document.getElementById("filtro-alerta-res")?.value;
    if (ftipo) params.set("tipo", ftipo);
    if (fprio) params.set("prioridade", fprio);
    if (fres) params.set("resolvido", fres);
    const [res, mpRes, lRes] = await Promise.all([
        API.listarAlertas(params.toString()),
        API.listarMateriasPrimas(),
        API.listarLotes()
    ]);
    const data = res.ok ? res.data : [];
    const materias = mpRes.ok ? mpRes.data : [];
    const lotes = lRes.ok ? lRes.data : [];
    const nomeMateria = id => {
        if (id == null) return "-";
        const m = materias.find(x => x.id === id);
        if (!m) return "-";
        return m.codigo ? `${m.nome} (${m.codigo})` : m.nome;
    };
    const rotuloLote = id => {
        if (id == null) return "-";
        const l = lotes.find(x => x.id === id);
        return (l && l.numero_lote) || ("Lote " + id);
    };
    const nNaoResolvidos = data.filter(a => !a.resolvido).length;

    let html = `
    <div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-alertas-prio", icone: "bi-exclamation-triangle", label: "Alertas por prioridade",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${data.length} alertas</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-alertas-tipo", icone: "bi-tags", label: "Alertas por tipo",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${nNaoResolvidos} nao resolvidos</span>`
        })}</div>
    </div>
    <div class="filters-bar">
        <select class="form-select form-select-sm" id="filtro-alerta-tipo">
            <option value="">Todos tipos</option>
            <option value="ESTOQUE_MINIMO" ${ftipo=="ESTOQUE_MINIMO"?"selected":""}>Estoque Minimo</option>
            <option value="VENCIMENTO" ${ftipo=="VENCIMENTO"?"selected":""}>Vencimento</option>
            <option value="REPOSICAO" ${ftipo=="REPOSICAO"?"selected":""}>Reposicao</option>
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
    html += tituloTabela("Alertas") + renderTable(
        ["ID", "Tipo", "Materia-Prima", "Lote", "Descricao", "Prioridade", "Resolvido", "Data"],
        data.map(a => [a.id, a.tipo, nomeMateria(a.materia_prima_id), rotuloLote(a.lote_id), a.descricao || "-",
            `<span class="badge ${a.prioridade == "ALTA" ? "bg-danger" : a.prioridade == "MEDIA" ? "bg-warning text-dark" : "bg-secondary"}">${a.prioridade}</span>`,
            a.resolvido ? "Sim" : "Nao", a.data_alerta]),
        r => !r[6] || r[6] === "Nao" ? `<button class="btn btn-sm btn-outline-success" onclick="resolverAlerta(${r[0]})"><i class="bi bi-check-lg"></i> Resolver</button>` : "",
        { chave: "alertas", ocultar: [0] }
    );
    document.getElementById("content-body").innerHTML = html;

    const prio = agruparPorCampo(data, "prioridade");
    criarGraficoDonut("graf-alertas-prio", {
        titulo: "Alertas por prioridade",
        rotulos: prio.rotulos,
        valores: prio.valores
    });

    const tipos = agruparPorCampo(data, "tipo");
    criarGraficoBarra("graf-alertas-tipo", {
        titulo: "Alertas por tipo",
        categorias: tipos.rotulos,
        series: [{ name: "Alertas", data: tipos.valores, color: "#3b82f6" }],
        distribuido: true,
        coresDistribuidas: coresCompletas(Math.max(tipos.rotulos.length, 1)).slice(0, tipos.rotulos.length),
        rotacionar: false
    });
}

window.resolverAlerta = async function (id) { await API.resolverAlerta(id); renderAlertas(); };
