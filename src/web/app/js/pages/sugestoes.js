async function renderSugestoes() {
    const [res, mpRes] = await Promise.all([
        API.listarSugestoes(),
        API.listarMateriasPrimas()
    ]);
    const data = res.ok ? res.data : [];
    const materias = mpRes.ok ? mpRes.data : [];
    const nomeMateria = id => {
        const m = materias.find(x => x.id === id);
        if (!m) return "-";
        return m.codigo ? `${m.nome} (${m.codigo})` : m.nome;
    };
    let html = `<div class="d-flex justify-content-between mb-3">
        <p></p>
        <button class="btn btn-warning btn-sm" onclick="gerarSugestoes()"><i class="bi bi-magic"></i> Gerar Sugestoes</button>
    </div>`;
    html += tituloTabela("Sugestoes") + renderTable(
        ["ID", "Materia-Prima", "Data", "Qtd Sugerida", "Motivo", "Status"],
        data.map(s => [s.id, nomeMateria(s.materia_prima_id), s.data_sugestao, s.quantidade_sugerida, s.motivo || "-",
            `<span class="badge ${statusBadge(s.status)}">${s.status}</span>`]),
        r => `<button class="btn btn-sm btn-outline-success me-1" onclick="aprovarSugestao(${r[0]})"><i class="bi bi-check-lg"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="rejeitarSugestao(${r[0]})"><i class="bi bi-x-lg"></i></button>`,
        { chave: "sugestoes", ocultar: [0] }
    );
    document.getElementById("content-body").innerHTML = html;
}

window.gerarSugestoes = async function () {
    const res = await API.gerarSugestoes();
    alert(res.ok ? res.data : "Erro ao gerar sugestoes");
    renderSugestoes();
};
window.aprovarSugestao = async function (id) { await API.aprovarSugestao(id); renderSugestoes(); };
window.rejeitarSugestao = async function (id) { await API.rejeitarSugestao(id); renderSugestoes(); };
