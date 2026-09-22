let graficoConsumo = null;

const CORES_GRAFICO = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
    "#ec4899",
    "#e11d48",
    "#14b8a6",
    "#0ea5e9",
    "#64748b",
    "#a855f7",
    "#f472b6",
    "#fbbf24",
    "#78716c",
    "#92400e"
];

function coresCompletas(total) {
    const n = CORES_GRAFICO.length;
    if (total <= n) {
        const passo = n / total;
        return Array.from({ length: total }, (_, i) => CORES_GRAFICO[Math.floor(i * passo) % n]);
    }
    return Array.from({ length: total }, (_, i) => CORES_GRAFICO[i % n]);
}

function montarSeriesTodas(materias) {
    const meses = [...new Set(
        materias.flatMap(m => (m.consumo_mensal || []).map(x => x.mes))
    )].sort();

    const cores = coresCompletas(materias.length);

    const comTotal = materias.map((m, i) => {
        const total = (m.consumo_mensal || []).reduce((s, x) => s + (x.consumo || 0), 0);
        return { m, total, i };
    });

    comTotal.sort((a, b) => b.total - a.total);

    const series = comTotal.map((item, idx) => ({
        name: item.m.nome,
        data: meses.map(mes => {
            const x = (item.m.consumo_mensal || []).find(y => y.mes === mes);
            return x ? x.consumo : null;
        }),
        color: cores[item.i]
    }));

    return { categories: meses, series };
}

function montarDadosGrafico(mp) {
    const mensal = mp && mp.consumo_mensal ? mp.consumo_mensal : [];
    return {
        categories: mensal.map(x => x.mes),
        series: [{
            name: mp ? mp.nome : "Consumo",
            data: mensal.map(x => x.consumo),
            color: "#3b82f6"
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
    const chartContainer = document.getElementById("grafico-consumo");
    if (!select || !chartContainer) return;

    if (typeof ApexCharts === "undefined") {
        mostrarErroGrafico("ApexCharts nao carregou. Verifique o CDN em app.html.");
        return;
    }
    if (dataList.length === 0) {
        mostrarErroGrafico("Nenhuma materia-prima com dados para o grafico.");
        return;
    }

    if (graficoConsumo) {
        graficoConsumo.destroy();
        graficoConsumo = null;
    }

    const selecionado = select.value;
    const dados = selecionado === ""
        ? montarSeriesTodas(dataList)
        : montarDadosGrafico(dataList.find(m => m.id === Number(selecionado)));

    const isMulti = dados.series.length > 1;
    const chartHeight = isMulti ? Math.max(350, Math.min(500, 300 + dados.series.length * 30)) : 320;

    try {
        const options = {
            series: dados.series,
            chart: {
                type: "line",
                height: chartHeight,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                toolbar: { show: false },
                background: "transparent",
                dropShadow: { enabled: false },
                redrawOnWindowResize: true,
                redrawOnParentResize: true,
                animations: {
                    enabled: true,
                    easing: "easeinout",
                    speed: 600,
                    dynamicAnimation: { enabled: true, speed: 350 }
                }
            },
            colors: dados.series.map(s => s.color),
            stroke: {
                curve: "smooth",
                width: isMulti ? 3 : 3.5,
                lineCap: "round"
            },
            markers: {
                size: isMulti ? 5 : 6,
                strokeWidth: 2,
                strokeColors: "#1e2028",
                fillColors: dados.series.map(s => s.color),
                hover: {
                    sizeOffset: 5,
                    size: isMulti ? 9 : 11
                },
                discrete: []
            },
            fill: {
                type: "solid",
                opacity: 1
            },
            xaxis: {
                categories: dados.categories,
                labels: {
                    style: {
                        colors: "#8e99a4",
                        fontSize: "11px",
                        fontFamily: "inherit"
                    },
                    offsetX: 0,
                    rotate: 0,
                    maxHeight: 60
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                },
                crosshairs: {
                    show: true,
                    position: "front",
                    stroke: {
                        color: "#3b82f6",
                        width: 1,
                        dashArray: 4
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#8e99a4",
                        fontSize: "11px",
                        fontFamily: "inherit"
                    },
                    offsetX: 0,
                    formatter: (val) => val !== null ? val.toFixed(0) : ""
                },
                min: 0,
                forceNiceScale: true
            },
            grid: {
                borderColor: "#2a2d35",
                strokeDashArray: 4,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 10, bottom: 0 }
            },
            tooltip: {
                shared: true,
                intersect: false,
                theme: "dark",
                style: {
                    fontSize: "11px",
                    fontFamily: "inherit"
                },
                y: {
                    formatter: (val) => val !== null ? val.toFixed(0) + " un" : ""
                },
                marker: {
                    show: true
                }
            },
            legend: {
                show: true,
                position: "bottom",
                horizontalAlign: "center",
                fontSize: "11px",
                fontFamily: "inherit",
                fontWeight: 500,
                labels: {
                    colors: "#d1d5db",
                    useSeriesColors: false
                },
                markers: {
                    fillColors: dados.series.map(s => s.color),
                    width: 10,
                    height: 10,
                    strokeWidth: 0,
                    radius: 2
                },
                itemMargin: {
                    horizontal: 6,
                    vertical: 4
                },
                onItemClick: {
                    toggleDataSeries: true
                },
                onItemHover: {
                    highlightDataSeries: true
                }
            },
            states: {
                active: {
                    allowMultipleDataPointsSelection: true,
                    filter: { type: "none" }
                },
                hover: { filter: { type: "none" } },
                inactive: { filter: { type: "none" } }
            },
            title: {
                text: "Consumo Mensal de Materias-Primas",
                align: "left",
                style: {
                    color: "#e5e7eb",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "inherit"
                }
            },
            noData: { text: "Sem dados para exibir" }
        };

        graficoConsumo = new ApexCharts(chartContainer, options);
        graficoConsumo.render().then(() => {
            const legendItems = chartContainer.querySelectorAll('.apexcharts-legend-series');
            legendItems.forEach((el, i) => {
                el.addEventListener('mouseenter', () => {
                    if (graficoConsumo) graficoConsumo.showTooltip([i]);
                });
                el.addEventListener('mouseleave', () => {
                    if (graficoConsumo) graficoConsumo.hideTooltip();
                });
            });
        });
    } catch (e) {
        console.error("[Grafico] Erro ao criar o grafico:", e);
        mostrarErroGrafico("Erro ao criar o grafico: " + (e && e.message ? e.message : e));
    }
};

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
    <div class="chart-card mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-graph-up text-primary"></i>
                    <label class="form-label mb-0 text-body-secondary small">Material</label>
                </div>
                <select class="form-select form-select-sm" id="select-mp" onchange="atualizarGrafico()" style="width:auto; min-width:220px">
                    ${opcoes}
                </select>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-body-secondary text-body-secondary small" id="chart-count">${data.length} materiais</span>
            </div>
        </div>
        <div id="msg-grafico" class="text-danger small mb-2"></div>
        <div id="grafico-consumo" style="min-height:320px"></div>
    </div>
    <div class="filters-bar">
        <input class="form-control form-control-sm" placeholder="Nome" id="filtro-mp-nome" value="${fnome || ""}">
        <select class="form-select form-select-sm" id="filtro-mp-baixo"><option value="">Todos</option>
            <option value="true" ${fbaixo == "true" ? "selected" : ""}>Estoque Baixo</option></select>
        <select class="form-select form-select-sm" id="filtro-mp-venc"><option value="">Todos</option>
            <option value="true" ${fvenc == "true" ? "selected" : ""}>Vencendo</option></select>
        <button class="btn btn-sm btn-outline-secondary" onclick="renderMateriasPrimas()">Filtrar</button>
    </div>
    <div class="table-wrap mt-3">
        ${tabela}
    </div>`;

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
