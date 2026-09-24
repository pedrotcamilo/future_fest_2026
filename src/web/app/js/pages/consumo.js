async function renderConsumo() {
    destruirGraficos();
    const params = new URLSearchParams();
    const finicio = document.getElementById("filtro-cons-inicio")?.value;
    const ffim = document.getElementById("filtro-cons-fim")?.value;
    const fmp = document.getElementById("filtro-cons-mp")?.value;
    if (finicio) params.set("inicio", finicio);
    if (ffim) params.set("fim", ffim);
    if (fmp) params.set("materiaPrima", fmp);

    const [res, mpRes] = await Promise.all([
        API.listarConsumos(params.toString()),
        API.listarMateriasPrimas()
    ]);
    const data = res.ok ? res.data : [];
    const materias = mpRes.ok ? mpRes.data : [];

    const nomeDe = id => {
        const m = materias.find(x => x.id === id);
        return m ? m.nome : "MP " + id;
    };

    const opcoesMp = `<option value="">Todas as materias-primas</option>` +
        materias.map(m =>
            `<option value="${m.id}" ${fmp == m.id ? "selected" : ""}>${m.nome}</option>`
        ).join("");

    const nMaterias = new Set(data.map(c => c.materia_prima_id)).size;

    let html = `
    <div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-consumo-mensal",
            label: "Consumo mensal",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${data.length} lancamentos</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-consumo-total",
            icone: "bi-bar-chart",
            label: "Total por materia-prima",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${nMaterias} materias</span>`
        })}</div>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" type="date" id="filtro-cons-inicio" value="${finicio||""}">
        <input class="form-control form-control-sm" type="date" id="filtro-cons-fim" value="${ffim||""}">
        <select class="form-select form-select-sm" style="max-width:240px" id="filtro-cons-mp">${opcoesMp}</select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderConsumo()">Filtrar</button>
    </div>`;
    html += renderTable(["ID", "Materia-Prima", "Data", "Quantidade"],
        data.map(c => [c.id, nomeDe(c.materia_prima_id), c.data, c.quantidade]));
    document.getElementById("content-body").innerHTML = html;

    /* Linha mensal: multiserie por materia-prima quando "Todas",
       serie unica quando uma MP esta selecionada no filtro. */
    const serie = serieMensal(data, {
        campoData: "data",
        campoQtd: "quantidade",
        extrairRotulo: fmp ? null : (r => nomeDe(r.materia_prima_id)),
        nomeGrupo: fmp ? nomeDe(Number(fmp)) : "Total consumido",
        ordemRotulos: materias.map(m => m.nome)
    });
    criarGraficoLinha("graf-consumo-mensal", {
        titulo: fmp ? "Consumo mensal de " + nomeDe(Number(fmp)) : "Consumo mensal por materia-prima",
        categorias: serie.categories,
        series: serie.series
    });

    /* Barra: total consumido por materia-prima no periodo filtrado. */
    const totais = new Map();
    data.forEach(c => {
        totais.set(c.materia_prima_id, (totais.get(c.materia_prima_id) || 0) + (Number(c.quantidade) || 0));
    });
    const itens = [...totais.entries()]
        .map(([id, total]) => ({ nome: nomeDe(id), total }))
        .sort((a, b) => b.total - a.total);
    criarGraficoBarra("graf-consumo-total", {
        titulo: "Total consumido no periodo",
        categorias: itens.map(i => i.nome),
        series: [{ name: "Total", data: itens.map(i => i.total), color: "#3b82f6" }],
        altura: alturaGraficoBarra(Math.max(itens.length, 1))
    });
}
