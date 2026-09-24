/* Helpers de graficos compartilhados entre as paginas.
   Registrado em loader.js antes dos arquivos de pagina.

   ATENCAO: os scripts sao executados como <script> classicos e dividem o
   escopo global do documento — nenhum destes nomes pode ser redeclarado
   em outro arquivo (redeclaracao de const/let/function no mesmo escopo
   gera SyntaxError e derruba a pagina toda). */

const FONTE_GRAFICO = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

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

/* Instancias ativas por id de container (evita canvases duplicados e orfaos
   quando a pagina re-renderiza o content-body). */
const GRAFICOS_ATIVOS = {};

function coresCompletas(total) {
    const n = CORES_GRAFICO.length;
    if (total <= n) {
        const passo = n / total;
        return Array.from({ length: total }, (_, i) => CORES_GRAFICO[Math.floor(i * passo) % n]);
    }
    return Array.from({ length: total }, (_, i) => CORES_GRAFICO[i % n]);
}

function formatarValor(valor, casas) {
    if (valor === null || valor === undefined) return "";
    const n = Number(valor);
    if (isNaN(n)) return String(valor);
    return n.toFixed(casas || 0);
}

/* Casas decimais "naturais" dos dados (inteiro => 0, 8.5 => 1, 0.043 => 3). */
function casasDecimais(valores) {
    let casas = 0;
    (valores || []).forEach(v => {
        if (v === null || v === undefined) return;
        const s = String(Number(v));
        if (s.indexOf(".") >= 0) casas = Math.max(casas, Math.min(3, s.split(".")[1].length));
    });
    return casas;
}

function alturaGraficoLinha(nSeries) {
    return nSeries > 1 ? Math.max(350, Math.min(500, 300 + nSeries * 30)) : 320;
}

function alturaGraficoBarra(nCategorias) {
    return Math.max(300, Math.min(560, 120 + Math.max(nCategorias, 1) * 24));
}

function destruirGrafico(id) {
    const instancia = GRAFICOS_ATIVOS[id];
    if (!instancia) return;
    try { instancia.destroy(); } catch (e) { console.warn("[Grafico] Falha ao destruir " + id + ":", e); }
    delete GRAFICOS_ATIVOS[id];
}

/* Chamada no inicio de toda renderizacao que reescreve o content-body. */
function destruirGraficos() {
    Object.keys(GRAFICOS_ATIVOS).forEach(destruirGrafico);
}

function mostrarErroGrafico(msgId, msg) {
    console.error("[Grafico] " + msg);
    const aviso = document.getElementById(msgId || "");
    if (aviso) aviso.textContent = msg;
}

/* Cartao .chart-card no mesmo layout da pagina de materias-primas:
   cabecalho (icone/label/acoes/badge) + espaco de erro + container. */
function cartaoGrafico(opcoes) {
    opcoes = opcoes || {};
    const id = opcoes.id;
    const msgId = opcoes.msgId || ("msg-" + id);
    const altura = opcoes.altura || 320;
    const icone = opcoes.icone || "bi-graph-up";
    const esquerda = opcoes.label
        ? `<div class="d-flex align-items-center gap-2">
                <i class="bi ${icone} text-primary"></i>
                <label class="form-label mb-0 text-body-secondary small">${opcoes.label}</label>
            </div>`
        : `<i class="bi ${icone} text-primary"></i>`;
    return `<div class="chart-card mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-3">${esquerda}${opcoes.acoes || ""}</div>
            <div class="d-flex align-items-center gap-2">${opcoes.badge || ""}</div>
        </div>
        <div id="${msgId}" class="text-danger small mb-2"></div>
        <div id="${id}" style="min-height:${altura}px"></div>
    </div>`;
}

function _opcoesBase(titulo, altura) {
    return {
        chart: {
            height: altura || 320,
            fontFamily: FONTE_GRAFICO,
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
        theme: { mode: "dark" },
        grid: {
            borderColor: "#2a2d35",
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { top: 10, bottom: 0 }
        },
        legend: {
            show: true,
            position: "bottom",
            horizontalAlign: "center",
            fontSize: "11px",
            fontFamily: "inherit",
            fontWeight: 500,
            labels: { colors: "#d1d5db", useSeriesColors: false },
            itemMargin: { horizontal: 6, vertical: 4 },
            onItemClick: { toggleDataSeries: true },
            onItemHover: { highlightDataSeries: true }
        },
        states: {
            active: { allowMultipleDataPointsSelection: true, filter: { type: "none" } },
            hover: { filter: { type: "none" } },
            inactive: { filter: { type: "none" } }
        },
        title: {
            text: titulo || "",
            align: "left",
            style: { color: "#e5e7eb", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" }
        },
        noData: { text: "Sem dados para exibir" }
    };
}

function _estiloTextoEixo() {
    return { colors: "#8e99a4", fontSize: "11px", fontFamily: "inherit" };
}

function _casasDosDados(series) {
    const todos = [];
    (series || []).forEach(s => (s.data || []).forEach(v => todos.push(v)));
    return casasDecimais(todos);
}

function _opcoesLinha(o) {
    const altura = o.altura || alturaGraficoLinha((o.series || []).length);
    const op = _opcoesBase(o.titulo, altura);
    const series = (o.series || []).map(s => ({ name: s.name, data: s.data }));
    const cores = (o.series || []).map(s => s.color || "#3b82f6");
    const isMulti = series.length > 1;
    const sufixo = o.sufixo || "";
    const casas = o.decimais !== undefined ? o.decimais : _casasDosDados(series);

    const formatarEixo = v => (v === null || v === undefined) ? "" : formatarValor(v, casas);
    const formatarTooltip = v => {
        const txt = formatarValor(v, casas);
        return txt === "" ? "" : txt + (sufixo ? " " + sufixo : "");
    };

    op.chart.type = "line";
    op.series = series;
    op.colors = cores;
    op.stroke = { curve: "smooth", width: isMulti ? 3 : 3.5, lineCap: "round" };
    op.markers = {
        size: isMulti ? 5 : 6,
        strokeWidth: 2,
        strokeColors: "#1e2028",
        fillColors: cores,
        hover: { sizeOffset: 5, size: isMulti ? 9 : 11 },
        discrete: []
    };
    op.fill = { type: "solid", opacity: 1 };
    op.xaxis = {
        categories: o.categorias || [],
        labels: { style: _estiloTextoEixo(), offsetX: 0, rotate: 0, maxHeight: 60 },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, position: "front", stroke: { color: "#3b82f6", width: 1, dashArray: 4 } }
    };
    op.yaxis = {
        labels: { style: _estiloTextoEixo(), offsetX: 0, formatter: formatarEixo },
        min: 0,
        forceNiceScale: true
    };
    op.tooltip = {
        shared: true,
        intersect: false,
        theme: "dark",
        style: { fontSize: "11px", fontFamily: "inherit" },
        y: { formatter: formatarTooltip },
        marker: { show: true }
    };
    op.legend = Object.assign({}, op.legend, {
        markers: { fillColors: cores, width: 10, height: 10, strokeWidth: 0, radius: 2 }
    });
    return op;
}

function _opcoesBarra(o) {
    const altura = o.altura || alturaGraficoBarra((o.categorias || []).length);
    const op = _opcoesBase(o.titulo, altura);
    const series = (o.series || []).map(s => ({ name: s.name, data: s.data }));
    const cores = (o.series || []).map(s => s.color || "#3b82f6");
    const distribuido = !!o.distribuido;
    const sufixo = o.sufixo || "";
    const casas = o.decimais !== undefined ? o.decimais : _casasDosDados(series);

    const formatarEixo = v => (v === null || v === undefined) ? "" : formatarValor(v, casas);
    const formatarTooltip = v => {
        const txt = formatarValor(v, casas);
        return txt === "" ? "" : txt + (sufixo ? " " + sufixo : "");
    };

    op.chart.type = "bar";
    op.series = series;
    op.colors = distribuido
        ? (o.coresDistribuidas || coresCompletas((o.categorias || []).length))
        : cores;
    op.plotOptions = {
        bar: { horizontal: false, columnWidth: "55%", borderRadius: 3, distributed: distribuido, stacked: !!o.empilhado }
    };
    op.dataLabels = { show: false };
    op.fill = { opacity: 1 };
    op.xaxis = {
        categories: o.categorias || [],
        labels: {
            style: _estiloTextoEixo(),
            rotate: o.rotacionar === false ? 0 : -20,
            maxHeight: 70,
            hideOverlappingLabels: true
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    };
    op.yaxis = {
        labels: { style: _estiloTextoEixo(), formatter: formatarEixo },
        min: o.min0 === false ? undefined : 0,
        forceNiceScale: true
    };
    op.tooltip = {
        shared: !distribuido,
        intersect: false,
        theme: "dark",
        style: { fontSize: "11px", fontFamily: "inherit" },
        y: { formatter: formatarTooltip },
        marker: { show: true }
    };
    op.legend = Object.assign({}, op.legend, {
        show: series.length > 1,
        markers: { fillColors: cores, width: 10, height: 10, strokeWidth: 0, radius: 2 }
    });
    return op;
}

function _opcoesDonut(o) {
    const altura = o.altura || 300;
    const op = _opcoesBase(o.titulo, altura);
    const rotulos = (o.rotulos || []).map(String);
    const valores = (o.valores || []).map(v => Number(v) || 0);
    const cores = coresCompletas(Math.max(rotulos.length, 1)).slice(0, rotulos.length);
    const total = valores.reduce((s, v) => s + v, 0);

    op.chart.type = "donut";
    op.series = valores;
    op.labels = rotulos;
    op.colors = cores;
    op.stroke = { width: 2, colors: ["#1e2028"] };
    op.dataLabels = { formatter: v => Math.round(v) + "%" };
    op.plotOptions = {
        pie: {
            donut: {
                size: "68%",
                labels: {
                    show: true,
                    name: { show: true, color: "#8e99a4", fontSize: "12px", offsetY: -4 },
                    value: {
                        show: true, color: "#e5e7eb", fontSize: "18px", fontWeight: 600,
                        formatter: v => formatarValor(v, casasDecimais([v]))
                    },
                    total: { show: true, label: "Total", color: "#8e99a4", formatter: () => formatarValor(total, casasDecimais(valores)) }
                }
            }
        }
    };
    op.tooltip = {
        theme: "dark",
        style: { fontSize: "11px", fontFamily: "inherit" },
        y: {
            formatter: (valor, ctx) => {
                const v = Number(valor) || 0;
                let pct = 0;
                try {
                    const totais = (ctx && ctx.w && ctx.w.globals && ctx.w.globals.seriesTotals) || [];
                    const soma = totais.reduce((s, x) => s + (Number(x) || 0), 0);
                    pct = soma ? Math.round((v / soma) * 100) : 0;
                } catch (e) { }
                return formatarValor(v, casasDecimais([v])) + " (" + pct + "%)";
            }
        }
    };
    op.legend = Object.assign({}, op.legend, {
        markers: { fillColors: cores, width: 10, height: 10, strokeWidth: 0, radius: 2 }
    });
    return op;
}

function _ligarLegenda(instancia, container) {
    try {
        container.querySelectorAll(".apexcharts-legend-series").forEach((el, i) => {
            el.addEventListener("mouseenter", () => {
                try { instancia.showTooltip([i]); } catch (e) { }
            });
            el.addEventListener("mouseleave", () => {
                try { instancia.hideTooltip(); } catch (e) { }
            });
        });
    } catch (e) { }
}

/* Cria (ou recria) o grafico do container. Sempre destroi a instancia
   anterior registrada com o mesmo id antes de criar a nova. */
function criarGrafico(containerId, options, msgId) {
    const el = document.getElementById(containerId);
    if (!el) return null;
    if (typeof ApexCharts === "undefined") {
        mostrarErroGrafico(msgId || ("msg-" + containerId), "ApexCharts nao carregou. Verifique o CDN em app.html.");
        return null;
    }
    destruirGrafico(containerId);
    try {
        const instancia = new ApexCharts(el, options);
        GRAFICOS_ATIVOS[containerId] = instancia;
        instancia.render().then(() => _ligarLegenda(instancia, el));
        return instancia;
    } catch (e) {
        console.error("[Grafico] Erro ao criar o grafico:", e);
        mostrarErroGrafico(msgId || ("msg-" + containerId), "Erro ao criar o grafico: " + (e && e.message ? e.message : e));
        delete GRAFICOS_ATIVOS[containerId];
        return null;
    }
}

function criarGraficoLinha(containerId, opcoes, msgId) {
    return criarGrafico(containerId, _opcoesLinha(opcoes || {}), msgId);
}

function criarGraficoBarra(containerId, opcoes, msgId) {
    return criarGrafico(containerId, _opcoesBarra(opcoes || {}), msgId);
}

function criarGraficoDonut(containerId, opcoes, msgId) {
    return criarGrafico(containerId, _opcoesDonut(opcoes || {}), msgId);
}

/* ─────────────────────────── Agregadores ─────────────────────────── */

/* Serie mensal a partir de registros "flat" (ex.: /consumos, /estoque/movimentacoes).
   opcoes: { campoData, campoQtd, extrairRotulo, ordemRotulos, nomeGrupo, ultimos, marcarParcial }
   - extrairRotulo: funcao(r) => nome da serie (multiserie); ausente => serie unica nomeGrupo/Total.
   - ordemRotulos: ordem estavel para as cores (ex.: lista de materias-primas).
   - ultimos: mantem apenas os N ultimos meses.
   - marcarParcial: acrescenta " (parcial)" ao mes corrente. */
function serieMensal(registros, opcoes) {
    opcoes = opcoes || {};
    const lista = Array.isArray(registros) ? registros : [];
    const campoData = opcoes.campoData;
    const campoQtd = opcoes.campoQtd;

    const pares = lista
        .map(r => ({
            mes: String((r && r[campoData]) || "").slice(0, 7),
            qtd: Number(r && r[campoQtd]) || 0,
            rotulo: opcoes.extrairRotulo
                ? String(opcoes.extrairRotulo(r))
                : String(opcoes.nomeGrupo || "Total")
        }))
        .filter(p => /^\d{4}-\d{2}$/.test(p.mes));

    let meses = [...new Set(pares.map(p => p.mes))].sort();
    if (opcoes.ultimos && meses.length > opcoes.ultimos) meses = meses.slice(-opcoes.ultimos);
    if (opcoes.marcarParcial) {
        const atual = new Date().toISOString().slice(0, 7);
        meses = meses.map(m => (m === atual ? m + " (parcial)" : m));
    }

    const grupos = new Map();
    pares.forEach(p => {
        if (!grupos.has(p.rotulo)) grupos.set(p.rotulo, new Map());
        const parciais = grupos.get(p.rotulo);
        parciais.set(p.mes, (parciais.get(p.mes) || 0) + p.qtd);
    });

    const ordem = [];
    (opcoes.ordemRotulos || []).forEach(l => {
        const chave = String(l);
        if (grupos.has(chave) && ordem.indexOf(chave) < 0) ordem.push(chave);
    });
    grupos.forEach((_, l) => { if (ordem.indexOf(l) < 0) ordem.push(l); });

    const cores = coresCompletas(Math.max(ordem.length, 1));
    const corDe = {};
    ordem.forEach((l, i) => { corDe[l] = cores[i % cores.length]; });

    const series = ordem.map(l => {
        const parciais = grupos.get(l);
        return {
            name: l,
            data: meses.map(rotulo => {
                const mes = rotulo.slice(0, 7);
                return parciais.has(mes) ? parciais.get(mes) : null;
            }),
            total: [...parciais.values()].reduce((s, v) => s + v, 0),
            color: corDe[l]
        };
    });

    if (series.length > 1) series.sort((a, b) => b.total - a.total);
    /* Serie unica explicita (nomeGrupo) usa o mesmo azul da pagina de MP. */
    if (!opcoes.extrairRotulo && series.length === 1) series[0].color = "#3b82f6";

    return { categories: meses, series };
}

/* Serie mensal a partir de materias-primas com consumo_mensal[] (GET /materias-primas). */
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

    const series = comTotal.map(item => ({
        name: item.m.nome,
        data: meses.map(mes => {
            const x = (item.m.consumo_mensal || []).find(y => y.mes === mes);
            return x ? x.consumo : null;
        }),
        color: cores[item.i]
    }));

    return { categories: meses, series };
}

/* Serie de uma unica materia-prima (consumo_mensal[]). */
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

/* Contagem de registros por valor de campo (ex.: status, prioridade, tipo).
   Retorna { rotulos, valores } ordenado do maior para o menor. */
function agruparPorCampo(registros, campo) {
    const mapa = new Map();
    (Array.isArray(registros) ? registros : []).forEach(r => {
        const bruto = r ? r[campo] : null;
        const chave = (bruto === null || bruto === undefined || bruto === "") ? "-" : String(bruto);
        mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });
    const itens = [...mapa.entries()].map(([rotulo, total]) => ({ rotulo, total }));
    itens.sort((a, b) => b.total - a.total || String(a.rotulo).localeCompare(String(b.rotulo)));
    return { rotulos: itens.map(i => i.rotulo), valores: itens.map(i => i.total) };
}

/* Faixas de validade dos lotes: vencidos / ate 30 / 31 a 90 / mais de 90. */
function faixasDeValidade(lotes) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const faixas = { "Vencidos": 0, "Ate 30 dias": 0, "31 a 90 dias": 0, "Mais de 90 dias": 0 };
    (Array.isArray(lotes) ? lotes : []).forEach(l => {
        if (!l || !l.data_validade) return;
        const d = new Date(String(l.data_validade).slice(0, 10) + "T00:00:00");
        if (isNaN(d.getTime())) return;
        const dias = Math.round((d - hoje) / 86400000);
        if (dias < 0) faixas["Vencidos"]++;
        else if (dias <= 30) faixas["Ate 30 dias"]++;
        else if (dias <= 90) faixas["31 a 90 dias"]++;
        else faixas["Mais de 90 dias"]++;
    });
    return { rotulos: Object.keys(faixas), valores: Object.values(faixas) };
}

/* Dias ate a validade (negativo = ja vencido). */
function diasAteVencer(dataValidade) {
    if (!dataValidade) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const d = new Date(String(dataValidade).slice(0, 10) + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return Math.round((d - hoje) / 86400000);
}
