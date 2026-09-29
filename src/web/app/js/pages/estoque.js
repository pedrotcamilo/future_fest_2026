let estoqueCache = { estoque: [], movs: [], materias: [], lotes: [] };

async function renderEstoque() {
    destruirGraficos();
    const [eRes, mRes, mpRes, lRes] = await Promise.all([
        API.consultarEstoque(),
        API.listarMovimentacoes(),
        API.listarMateriasPrimas(),
        API.listarLotes()
    ]);
    estoqueCache = {
        estoque: eRes.ok ? eRes.data : [],
        movs: mRes.ok ? mRes.data : [],
        materias: mpRes.ok ? mpRes.data : [],
        lotes: lRes.ok ? lRes.data : []
    };
    desenharEstoque();
}

function estoqueMinimoDe(id) {
    const mp = (estoqueCache.materias || []).find(m => m.id === id);
    return mp && mp.estoque_minimo != null ? Number(mp.estoque_minimo) : null;
}

/* Rotulo do lote na tela: o numero do lote; sem numero, "Lote <id>". */
function rotuloLote(id) {
    if (id == null || id === "") return "-";
    const l = (estoqueCache.lotes || []).find(x => x.id === id);
    return (l && l.numero_lote) || ("Lote " + id);
}

/* Re-renderiza graficos + abas + tabela a partir do cache (filtros locais). */
function desenharEstoque() {
    const fnome = document.getElementById("filtro-est-nome")?.value || "";
    const fbaixo = document.getElementById("filtro-est-baixo")?.value || "";

    const linhas = (estoqueCache.estoque || [])
        .map(e => {
            const min = estoqueMinimoDe(e.materia_prima_id);
            const abaixo = min !== null && Number(e.estoque) < min;
            return { id: e.materia_prima_id, nome: e.nome, estoque: e.estoque, min, abaixo };
        })
        .filter(e => {
            if (fnome && !String(e.nome || "").toLowerCase().includes(fnome.toLowerCase())) return false;
            if (fbaixo === "true" && !e.abaixo) return false;
            return true;
        });

    const movs = estoqueCache.movs || [];
    const somaTipo = new Map();
    movs.forEach(m => {
        const t = m.tipo || "-";
        somaTipo.set(t, (somaTipo.get(t) || 0) + (Number(m.quantidade) || 0));
    });

    const html = `
    <div class="row g-3 mb-4">
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-estoque-atual",
            icone: "bi-box-seam",
            label: "Estoque atual",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${linhas.length} materias</span>`
        })}</div>
        <div class="col-lg-6">${cartaoGrafico({
            id: "graf-estoque-mov",
            icone: "bi-arrow-left-right",
            label: "Movimentacoes (entradas x saidas)",
            badge: `<span class="badge bg-body-secondary text-body-secondary small">${movs.length} movimentacoes</span>`
        })}</div>
    </div>
    <ul class="nav nav-tabs mb-3">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-estq">Estoque</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-mov">Movimentacoes</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-mov-nova">Nova Movimentacao</a></li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-estq">
            <div class="filters-bar">
                <input class="form-control form-control-sm" placeholder="Nome" id="filtro-est-nome" value="${fnome}">
                <select class="form-select form-select-sm" id="filtro-est-baixo">
                    <option value="">Todos</option>
                    <option value="true" ${fbaixo === "true" ? "selected" : ""}>Abaixo do minimo</option>
                </select>
                <button class="btn btn-sm btn-outline-secondary" onclick="desenharEstoque()">Filtrar</button>
            </div>
            <div class="mt-3">${tituloTabela("Estoque")}${renderTable(
                ["Nome", "Estoque", "Estoque Min", "Status"],
                linhas.map(e => [e.nome, e.estoque,
                    e.min !== null ? e.min : "-",
                    e.min === null ? "-" : (e.abaixo
                        ? '<span class="badge bg-danger">Abaixo do minimo</span>'
                        : '<span class="badge bg-success">OK</span>')]),
                null,
                { chave: "est-saldo" }
            )}</div>
        </div>
        <div class="tab-pane fade" id="tab-mov">
            ${tituloTabela("Movimentacoes")}${renderTable(["Lote", "Tipo", "Quantidade", "Data", "Observacao"],
                movs.map(m => [rotuloLote(m.lote_id), m.tipo, m.quantidade, m.data_movimento, m.observacao || "-"]),
                null,
                { chave: "est-movs" }
            )}
        </div>
        <div class="tab-pane fade" id="tab-mov-nova">
            <div class="card-dash p-3" style="max-width:500px">
                ${selGroup("Lote", "f-lote",
                    opcoesSelect(estoqueCache.lotes,
                        l => l.id,
                        l => l.numero_lote || ("Lote " + l.id),
                        "Selecione o lote"),
                    "")}
                <div class="mb-3"><label class="form-label">Tipo</label>
                    <select class="form-select" id="f-tipo"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saida</option></select></div>
                ${formGroup("Quantidade", "f-qtd", "number", "")}
                ${formGroup("Observacao", "f-obs", "text", "")}
                <button class="btn btn-primary" onclick="registrarMov()">Registrar</button>
                <div id="mov-msg" class="mt-2 small"></div>
            </div>
        </div>
    </div>`;

    document.getElementById("content-body").innerHTML = html;

    /* Barra empilhada horizontal: vermelho marca as MPs abaixo do estoque
       minimo. Top 12 + "Demais (N)" para os nomes das categorias nao ficarem
       espremidos no eixo (20 materias-primas em um card de metade da tela).
       (O donut de movimentacoes usa todos os registros, nao os filtrados.) */
    const ordenados = linhas
        .filter(e => e.estoque != null)
        .slice()
        .sort((a, b) => Number(b.estoque) - Number(a.estoque));
    const reduzido = topEOutros(
        ordenados.map(e => e.nome),
        [
            { name: "Estoque normal", color: "#3b82f6", data: ordenados.map(e => e.abaixo ? 0 : Number(e.estoque) || 0) },
            { name: "Abaixo do minimo", color: "#ef4444", data: ordenados.map(e => e.abaixo ? Number(e.estoque) || 0 : 0) }
        ],
        12
    );
    criarGraficoBarra("graf-estoque-atual", {
        titulo: ordenados.length > 12
            ? "Estoque por materia-prima - Top 12 (vermelho = abaixo do minimo)"
            : "Estoque por materia-prima (vermelho = abaixo do minimo)",
        categorias: reduzido.categorias,
        series: reduzido.series,
        empilhado: true,
        horizontal: true,
        mostrarValores: true
    });

    criarGraficoDonut("graf-estoque-mov", {
        titulo: "Movimentacoes por tipo (soma das quantidades)",
        rotulos: [...somaTipo.keys()],
        valores: [...somaTipo.values()]
    });
}

window.registrarMov = async function () {
    const d = { loteId: Number(val("f-lote")), tipo: val("f-tipo"), quantidade: Number(val("f-qtd")), observacao: val("f-obs") };
    const res = await API.registrarMovimentacao(d);
    document.getElementById("mov-msg").textContent = res.ok ? "Movimentacao registrada!" : "Erro: " + res.data;
    if (res.ok) setTimeout(renderEstoque, 1000);
};
