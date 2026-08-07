const TIMEOUT_INATIVIDADE_MS = 60 * 1000;
const AVISO_INATIVIDADE_MS = 30 * 1000;
let ultimaAtividade = Date.now();
let avisoAtivo = false;

function criarAvisoInatividade() {
    const overlay = document.createElement("div");
    overlay.id = "aviso-inatividade";
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:none;align-items:center;justify-content:center;flex-direction:column;text-align:center;";
    overlay.innerHTML = `<i class="bi bi-hourglass-split" style="font-size:4rem;color:#ffc107"></i>
        <h3 class="mt-3 text-white">Sessao inativa</h3>
        <p class="text-body-secondary">Movimente o mouse ou pressione uma tecla para continuar.</p>
        <div class="spinner-border text-warning" role="status"></div>`;
    document.body.appendChild(overlay);
    return overlay;
}

function mostrarAvisoInatividade() {
    if (avisoAtivo) return;
    avisoAtivo = true;
    const overlay = document.getElementById("aviso-inatividade") || criarAvisoInatividade();
    overlay.style.display = "flex";
}

function ocultarAvisoInatividade() {
    if (!avisoAtivo) return;
    avisoAtivo = false;
    const overlay = document.getElementById("aviso-inatividade");
    if (overlay) overlay.style.display = "none";
}

function reiniciarTimerInatividade() {
    ultimaAtividade = Date.now();
    ocultarAvisoInatividade();
}

async function deslogarPorInatividade() {
    try { await API.logout(); } catch (e) {}
    localStorage.removeItem("token");
    window.location.href = "/web/login";
}

function verificarInatividade() {
    const inativo = Date.now() - ultimaAtividade;
    if (inativo >= TIMEOUT_INATIVIDADE_MS) {
        deslogarPorInatividade();
    } else if (inativo >= AVISO_INATIVIDADE_MS) {
        mostrarAvisoInatividade();
    }
}

["mousemove", "keydown", "click", "scroll", "touchstart", "wheel"].forEach(evt =>
    document.addEventListener(evt, reiniciarTimerInatividade, { passive: true })
);

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) verificarInatividade();
});

setInterval(verificarInatividade, 1000);
