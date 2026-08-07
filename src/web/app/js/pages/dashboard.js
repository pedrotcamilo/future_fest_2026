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
