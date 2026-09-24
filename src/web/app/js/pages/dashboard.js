async function renderDashboard() {
    destruirGraficos();
    const [res, estq, compras, ordens, previsoes, alertas, mps, consumos] = await Promise.all([
        API.dashboard(), API.dashboardEstoque(), API.listarCompras(), API.listarOrdens(),
        API.listarPrevisoes(), API.listarAlertas(), API.listarMateriasPrimas(), API.listarConsumos()
    ]);
    const d = res.ok ? res.data : {};
    const estoque = estq.ok ? estq.data : [];
    const listaCompras = compras.ok ? compras.data : [];
    const listaOrdens = ordens.ok ? ordens.data : [];
    const listaPrevisoes = previsoes.ok ? previsoes.data : [];
    const listaAlertas = alertas.ok ? alertas.data : [];
    const materias = mps.ok ? mps.data : [];
    const listaConsumos = consumos.ok ? consumos.data : [];

    const nomeDe = id => {
        const m = materias.find(x => x.id === id);
        return m ? m.nome : "MP " + id;
    };
    const minDe = id => {
        const m = materias.find(x => x.id === id);
        return m && m.estoque_minimo != null ? Number(m.estoque_minimo) : null;
    };
    const abaixoDoMinimo = e => {
        const min = minDe(e.materia_prima_id);
        return min !== null && Number(e.estoque) < min;
    };

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

    html += `<div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "dash-estoque", icone: "bi-box-seam", label: "Estoque atual",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${estoque.length} materias</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "dash-consumo", label: "Consumo mensal",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${listaConsumos.length} lancamentos</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "dash-compras", icone: "bi-cart3", label: "Compras por status",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${listaCompras.length} compras</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "dash-ordens", icone: "bi-gear-wide-connected", label: "Ordens de producao",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${listaOrdens.length} ordens</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "dash-alertas-prio", icone: "bi-exclamation-triangle", label: "Alertas por prioridade",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${listaAlertas.length} alertas</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "dash-alertas-tipo", icone: "bi-tags", label: "Alertas por tipo", badge: ""
        })}</div>
        <div class="col-12">${cartaoGrafico({
            id: "dash-previsoes", icone: "bi-clipboard-data", label: "Consumo previsto por materia-prima",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${listaPrevisoes.length} previsoes</span>`
        })}</div>
    </div>`;

    if (estoque.length) {
        html += `<h6 class="mb-2">Estoque Atual</h6>${renderTable(
            ["Materia-Prima", "Estoque"],
            estoque.map(i => [i.nome, i.estoque])
        )}`;
    }
    const ativos = listaAlertas.filter(a => !a.resolvido);
    if (ativos.length) {
        html += `<h6 class="mt-4 mb-2">Alertas Ativos</h6>${renderTable(
            ["Tipo", "Descricao", "Prioridade", "Data"],
            ativos.map(a => [a.tipo, a.descricao || "-",
                `<span class="badge ${a.prioridade == "ALTA" ? "bg-danger" : a.prioridade == "MEDIA" ? "bg-warning text-dark" : "bg-secondary"}">${a.prioridade}</span>`,
                a.data_alerta])
        )}`;
    }

    document.getElementById("content-body").innerHTML = html;

    /* 1) Estoque por MP, destacando as abaixo do minimo em vermelho. */
    const ordenados = estoque.slice().sort((a, b) => Number(b.estoque || 0) - Number(a.estoque || 0));
    criarGraficoBarra("dash-estoque", {
        titulo: "Estoque por materia-prima (vermelho = abaixo do minimo)",
        categorias: ordenados.map(e => e.nome),
        series: [
            { name: "Estoque normal", data: ordenados.map(e => abaixoDoMinimo(e) ? 0 : Number(e.estoque) || 0), color: "#3b82f6" },
            { name: "Abaixo do minimo", data: ordenados.map(e => abaixoDoMinimo(e) ? Number(e.estoque) || 0 : 0), color: "#ef4444" }
        ],
        empilhado: true,
        altura: alturaGraficoBarra(Math.max(ordenados.length, 1))
    });

    /* 2) Consumo mensal: ultimos 6 meses fechados + mes corrente (parcial),
          agregado no cliente a partir de /consumos. */
    const serieConsumo = serieMensal(listaConsumos, {
        campoData: "data",
        campoQtd: "quantidade",
        nomeGrupo: "Total",
        ultimos: 7,
        marcarParcial: true
    });
    criarGraficoLinha("dash-consumo", {
        titulo: "Ultimos 6 meses fechados + mes corrente (parcial)",
        categorias: serieConsumo.categories,
        series: serieConsumo.series
    });

    /* 3/4/5) Donuts com agrupamento dinamico (nao dependem de enums fixos). */
    const comp = agruparPorCampo(listaCompras, "status");
    criarGraficoDonut("dash-compras", {
        titulo: "Compras por status",
        rotulos: comp.rotulos,
        valores: comp.valores
    });

    const ord = agruparPorCampo(listaOrdens, "status");
    criarGraficoDonut("dash-ordens", {
        titulo: "Ordens de producao por status",
        rotulos: ord.rotulos,
        valores: ord.valores
    });

    const prio = agruparPorCampo(listaAlertas, "prioridade");
    criarGraficoDonut("dash-alertas-prio", {
        titulo: "Alertas por prioridade",
        rotulos: prio.rotulos,
        valores: prio.valores
    });

    /* 6) Alertas por tipo (barras distribuidas). */
    const tipos = agruparPorCampo(listaAlertas, "tipo");
    criarGraficoBarra("dash-alertas-tipo", {
        titulo: "Alertas por tipo",
        categorias: tipos.rotulos,
        series: [{ name: "Alertas", data: tipos.valores, color: "#3b82f6" }],
        distribuido: true,
        coresDistribuidas: coresCompletas(Math.max(tipos.rotulos.length, 1)).slice(0, tipos.rotulos.length),
        altura: 300,
        rotacionar: false
    });

    /* 7) Consumo previsto por MP. */
    const prevPorMp = new Map();
    listaPrevisoes.forEach(p => {
        prevPorMp.set(p.materia_prima_id, (prevPorMp.get(p.materia_prima_id) || 0) + (Number(p.consumo_previsto) || 0));
    });
    const itensPrev = [...prevPorMp.entries()]
        .map(([id, total]) => ({ nome: nomeDe(id), total }))
        .sort((a, b) => b.total - a.total);
    criarGraficoBarra("dash-previsoes", {
        titulo: "Consumo previsto por materia-prima",
        categorias: itensPrev.map(i => i.nome),
        series: [{ name: "Previsto", data: itensPrev.map(i => i.total), color: "#8b5cf6" }],
        altura: alturaGraficoBarra(Math.max(itensPrev.length, 1))
    });
}
