async function renderConsumo() {
    const params = new URLSearchParams();
    const finicio = document.getElementById("filtro-cons-inicio")?.value;
    const ffim = document.getElementById("filtro-cons-fim")?.value;
    const fmp = document.getElementById("filtro-cons-mp")?.value;
    if (finicio) params.set("inicio", finicio);
    if (ffim) params.set("fim", ffim);
    if (fmp) params.set("materiaPrima", fmp);
    const res = await API.listarConsumos(params.toString());
    const data = res.ok ? res.data : [];
    let html = `
    <div class="filters-bar">
        <input class="form-control form-control-sm" type="date" id="filtro-cons-inicio" value="${finicio||""}">
        <input class="form-control form-control-sm" type="date" id="filtro-cons-fim" value="${ffim||""}">
        <input class="form-control form-control-sm" style="width:120px" placeholder="MP ID" id="filtro-cons-mp" value="${fmp||""}">
        <button class="btn btn-sm btn-outline-secondary" onclick="renderConsumo()">Filtrar</button>
    </div>`;
    html += renderTable(["ID", "Materia-Prima ID", "Data", "Quantidade"],
        data.map(c => [c.id, c.materia_prima_id, c.data, c.quantidade]));
    document.getElementById("content-body").innerHTML = html;
}
