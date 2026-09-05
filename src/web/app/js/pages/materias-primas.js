let graficoConsumo = null;

const CORES_GRAFICO = [
    "rgba(75, 192, 192, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 99, 132, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 205, 86, 1)",
    "rgba(201, 203, 207, 1)",
    "rgba(75, 192, 192, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 99, 132, 0.6)"
];

function coresCompletas(total) {
    return Array.from({ length: total }, (_, i) => CORES_GRAFICO[i % CORES_GRAFICO.length]);
}

function montarDatasetsTodas(materias) {
    const meses = [...new Set(
        materias.flatMap(m => (m.consumo_mensal || []).map(x => x.mes))
    )].sort();

    const cores = coresCompletas(materias.length);

    const datasets = materias.map((m, i) => ({
        label: m.nome,
        data: meses.map(mes => {
            const item = (m.consumo_mensal || []).find(x => x.mes === mes);
            return item ? item.consumo : null;
        }),
        borderColor: cores[i],
        backgroundColor: cores[i].replace(/1\)$/, "0.2)"),
        fill: false,
        tension: 0.1,
        spanGaps: true
    }));

    return { labels: meses, datasets };
}

function montarDadosGrafico(mp) {
    const mensal = mp && mp.consumo_mensal ? mp.consumo_mensal : [];
    return {
        labels: mensal.map(x => x.mes),
        datasets: [{
            label: mp ? mp.nome : "Consumo",
            data: mensal.map(x => x.consumo),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: true,
            tension: 0.4
        }]
    };
}

function mostrarErroGrafico(msg) {
    console.error("[Grafico] " + msg);
    const aviso = document.getElementById("msg-grafico");
    if (aviso) aviso.textContent = msg;
}

window.atualizarGrafico = function () {
    const select = document.getElementById("select-mp");
    const dataList = window.__materiasPrimas || [];
    const ctx = document.getElementById("grafico-consumo");
    if (!select || !ctx) return;

    if (typeof Chart === "undefined") {
        mostrarErroGrafico("Chart.js nao carregou. Verifique o CDN em app.html.");
        return;
    }
    if (dataList.length === 0) {
        mostrarErroGrafico("Nenhuma materia-prima com dados para o grafico.");
        return;
    }

    if (graficoConsumo) graficoConsumo.destroy();

    const selecionado = select.value;
    const dados = selecionado === ""
        ? montarDatasetsTodas(dataList)
        : montarDadosGrafico(dataList.find(m => m.id === Number(selecionado)));

    try {
        graficoConsumo = new Chart(ctx.getContext("2d"), {
            type: "line",
            data: {
                labels: dados.labels,
                datasets: dados.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    htmlLegend: {
                        containerID: "legend-container"
                    },
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: "Consumo Mensal de Materias-Primas"
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (e) {
        console.error("[Grafico] Erro ao criar o grafico:", e);
        mostrarErroGrafico("Erro ao criar o grafico: " + (e && e.message ? e.message : e));
    }
};


const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'row';
    listContainer.style.flexWrap = 'wrap';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    items.forEach(item => {
      const li = document.createElement('li');
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.flexDirection = 'row';
      li.style.margin = '2px 10px 2px 0';

      li.onclick = () => {
        const {type} = chart.config;
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
        }
        chart.update();
      };

      // Color box
      const boxSpan = document.createElement('span');
      boxSpan.style.background = item.fillStyle;
      boxSpan.style.borderColor = item.strokeStyle;
      boxSpan.style.borderWidth = item.lineWidth + 'px';
      boxSpan.style.display = 'inline-block';
      boxSpan.style.flexShrink = 0;
      boxSpan.style.height = '14px';
      boxSpan.style.marginRight = '6px';
      boxSpan.style.width = '14px';

      // Text
      const textContainer = document.createElement('p');
      textContainer.style.color = '#d7e4f0';
      textContainer.style.fontSize = '12px';
      textContainer.style.margin = 0;
      textContainer.style.padding = 0;
      textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);

      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  }
};

if (typeof Chart !== "undefined") {
  Chart.register(htmlLegendPlugin);
}

async function renderMateriasPrimas() {
    const params = new URLSearchParams();
    const fnome = document.getElementById("filtro-mp-nome")?.value;
    const fbaixo = document.getElementById("filtro-mp-baixo")?.value;
    const fvenc = document.getElementById("filtro-mp-venc")?.value;

    if (fnome) params.set("nome", fnome);

    if (fbaixo) params.set("estoqueBaixo", fbaixo);

    if (fvenc) params.set("vencendo", fvenc);

    const res = await API.listarMateriasPrimas(params.toString());
    const data = res.ok ? res.data : [];

    console.log(JSON.stringify(
        data.map(m => ({
            materia_prima: m.nome,
            consumo_mensal: m.consumo_mensal || []
        })),
        null, 2
    ));

    window.__materiasPrimas = data;

    const opcoes = `<option value="">Todas as materias-primas</option>` +
        data.map(m =>
            `<option value="${m.id}">${m.nome}</option>`
        ).join("");

    const tabela = renderTable(
        ["ID", "Codigo", "Nome", "Unidade", "Estoque Min", "Estoque Max", "Ativo"],
        data.map(m => [m.id, m.codigo || "-", m.nome, m.unidade || "-", m.estoque_minimo || "-", m.estoque_maximo || "-", m.ativo ? "Sim" : "Nao"]),
        r => `<button class="btn btn-sm btn-outline-info me-1" onclick="mpForm(${r[0]})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="mpDelete(${r[0]})"><i class="bi bi-trash"></i></button>`
    );

    const html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-primary btn-sm" onclick="mpForm(null)"><i class="bi bi-plus-lg"></i> Nova</button>
    </div>
    <div class="mb-3" style="max-width:320px">
        <label class="form-label small text-body-secondary">Material para o grafico</label>
        <select class="form-select form-select-sm" id="select-mp" onchange="atualizarGrafico()">
            ${opcoes}
        </select>
    </div>
    <div id="msg-grafico" class="text-danger small mb-2"></div>
    <div id="legend-container" class="mb-2"></div>
    <div style="height:320px; margin-bottom:1rem">
        <canvas id="grafico-consumo"></canvas>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" placeholder="Nome" id="filtro-mp-nome" value="${fnome || ""}">
        <select class="form-select form-select-sm" id="filtro-mp-baixo"><option value="">Todos</option>
            <option value="true" ${fbaixo == "true" ? "selected" : ""}>Estoque Baixo</option></select>
        <select class="form-select form-select-sm" id="filtro-mp-venc"><option value="">Todos</option>
            <option value="true" ${fvenc == "true" ? "selected" : ""}>Vencendo</option></select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderMateriasPrimas()">Filtrar</button>
    </div>
    ${tabela}`;

    document.getElementById("content-body").innerHTML = html;

    atualizarGrafico();
}

window.mpForm = async function (id) {
    let m = { codigo: "", nome: "", unidade: "", estoque_minimo: "", estoque_maximo: "", consumo_medio_mensal: "", ativo: true };
    if (id) { const r = await API.buscarMateriaPrima(id); if (r.ok && r.data) m = r.data; }
    showModal(id ? "Editar Materia-Prima" : "Nova Materia-Prima",
        formGroup("Codigo", "f-codigo", "text", m.codigo || "") +
        formGroup("Nome", "f-nome", "text", m.nome || "") +
        formGroup("Unidade", "f-unidade", "text", m.unidade || "") +
        formGroup("Estoque Minimo", "f-min", "number", m.estoque_minimo || "") +
        formGroup("Estoque Maximo", "f-max", "number", m.estoque_maximo || "") +
        formGroup("Consumo Medio Mensal", "f-consumo", "number", m.consumo_medio_mensal || "") +
        selGroup("Ativo", "f-ativo", [{ value: "true", label: "Sim" }, { value: "false", label: "Nao" }], m.ativo ? "true" : "false"),
        async function () {
            const d = { codigo: val("f-codigo"), nome: val("f-nome"), unidade: val("f-unidade"), estoque_minimo: val("f-min") ? Number(val("f-min")) : null, estoque_maximo: val("f-max") ? Number(val("f-max")) : null, consumo_medio_mensal: val("f-consumo") ? Number(val("f-consumo")) : null, ativo: val("f-ativo") === "true" };
            if (id) await API.atualizarMateriaPrima(id, d); else await API.criarMateriaPrima(d);
            closeModal(); renderMateriasPrimas();
        }
    );
};

window.mpDelete = async function (id) { if (confirm("Deletar materia-prima?")) { await API.deletarMateriaPrima(id); renderMateriasPrimas(); } };
