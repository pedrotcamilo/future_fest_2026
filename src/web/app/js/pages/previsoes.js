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
