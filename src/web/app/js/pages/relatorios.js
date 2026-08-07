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
