async function renderPrevisoes() {
    destruirGraficos();
    const fmp = document.getElementById("filtro-prev-mp")?.value || "";
    const [res, mpList] = await Promise.all([
        API.listarPrevisoes(),
        API.listarMateriasPrimas()
    ]);
    const data = res.ok ? res.data : [];
    const materias = mpList.ok ? mpList.data : [];

    /* Mesma janela do periodo das previsoes, para comparar previsto x realizado. */
    const datas = data
        .flatMap(p => [p.periodo_inicio, p.periodo_fim])
        .filter(Boolean)
        .map(d => String(d).slice(0, 10))
        .sort();
    const janela = new URLSearchParams();
    if (datas.length) {
        janela.set("inicio", datas[0]);
        janela.set("fim", datas[datas.length - 1]);
    }
    const relRes = await API.relatorioConsumo(janela.toString());
    const realizado = {};
    (relRes.ok ? relRes.data : []).forEach(r => {
        realizado[r.materia_prima_id] = Number(r.total_consumido) || 0;
    });

    const visiveis = fmp ? data.filter(p => String(p.materia_prima_id) === String(fmp)) : data;
    const nMaterias = new Set(visiveis.map(p => p.materia_prima_id)).size;

    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <div>
            <button class="btn btn-success btn-sm me-2" onclick="previsaoAutomatica()"><i class="bi bi-magic"></i> Gerar Automatica</button>
            <button class="btn btn-primary btn-sm" onclick="previsaoForm()"><i class="bi bi-plus-lg"></i> Nova Previsao</button>
        </div>
    </div>
    <div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-prev-comparativo", icone: "bi-clipboard-data", label: "Previsto x realizado",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${nMaterias} materias</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-prev-mes", icone: "bi-calendar3", label: "Previsoes geradas por mes",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${visiveis.length} previsoes</span>`
        })}</div>
    </div>
    <div class="filters-bar">
        <select class="form-select form-select-sm" style="max-width:240px" id="filtro-prev-mp">
            <option value="">Todas as materias-primas</option>
            ${materias.map(m => `<option value="${m.id}" ${fmp == m.id ? "selected" : ""}>${m.nome}</option>`).join("")}
        </select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderPrevisoes()">Filtrar</button>
    </div>`;
    const mpNome = id => {
        const m = materias.find(x => x.id === id);
        return m ? m.nome : id;
    };
    html += renderTable(
        ["ID", "Materia Prima", "Data Previsao", "Periodo", "Consumo Previsto", "Confianca", "Modelo"],
        visiveis.map(p => [p.id, mpNome(p.materia_prima_id), p.data_previsao,
            `${p.periodo_inicio} a ${p.periodo_fim}`,
            p.consumo_previsto, p.confianca ? p.confianca + "%" : "-", p.modelo_utilizado || "-"
        ])
    );
    document.getElementById("content-body").innerHTML = html;

    /* Previsto x realizado por materia-prima na mesma janela de periodo. */
    const porMp = new Map();
    visiveis.forEach(p => {
        const nome = mpNome(p.materia_prima_id);
        const atual = porMp.get(nome) || { previsto: 0, realizado: realizado[p.materia_prima_id] || 0 };
        atual.previsto += Number(p.consumo_previsto) || 0;
        porMp.set(nome, atual);
    });
    const itens = [...porMp.entries()]
        .map(([nome, v]) => ({ nome, ...v }))
        .sort((a, b) => b.previsto - a.previsto);
    criarGraficoBarra("graf-prev-comparativo", {
        titulo: "Previsao x consumo realizado no periodo",
        categorias: itens.map(i => i.nome),
        series: [
            { name: "Previsto", data: itens.map(i => i.previsto), color: "#8b5cf6" },
            { name: "Realizado", data: itens.map(i => i.realizado), color: "#22c55e" }
        ],
        altura: alturaGraficoBarra(Math.max(itens.length, 1))
    });

    /* Previsoes geradas por mes (ordem cronologica). */
    const porMes = new Map();
    visiveis.forEach(p => {
        const m = String(p.data_previsao || "").slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) porMes.set(m, (porMes.get(m) || 0) + 1);
    });
    const meses = [...porMes.keys()].sort();
    criarGraficoBarra("graf-prev-mes", {
        titulo: "Previsoes geradas por mes",
        categorias: meses,
        series: [{ name: "Previsoes", data: meses.map(m => porMes.get(m)), color: "#3b82f6" }],
        altura: 300,
        rotacionar: false
    });
}

window.previsaoAutomatica = async function () {
    showModal("Gerar Previsao Automatica", "Gerar previsoes pela media movel dos ultimos 6 meses?",
        async function () {
            const res = await API.gerarPrevisaoAutomatica();
            closeModal();
            alert(res.ok ? res.data : "Erro ao gerar previsoes");
            renderPrevisoes();
        }
    );
};

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
