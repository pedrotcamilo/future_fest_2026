let currentUser = null;

const PAGE_TITLES = {
    dashboard: "Dashboard", usuarios: "Usuarios", fornecedores: "Fornecedores",
    "materias-primas": "Materias-Primas", lotes: "Lotes", clientes: "Clientes",
    formulas: "Formulas", estoque: "Estoque", compras: "Compras",
    pedidos: "Pedidos", producao: "Producao", consumo: "Historico de Consumo",
    previsoes: "Previsoes de Consumo", sugestoes: "Sugestoes de Compra",
    alertas: "Alertas", relatorios: "Relatorios", configuracoes: "Configuracoes"
};

const PAGE_RENDERERS = {
    dashboard: renderDashboard,
    usuarios: renderUsuarios,
    fornecedores: renderFornecedores,
    "materias-primas": renderMateriasPrimas,
    lotes: renderLotes,
    clientes: renderClientes,
    formulas: renderFormulas,
    estoque: renderEstoque,
    compras: renderCompras,
    pedidos: renderPedidos,
    producao: renderProducao,
    consumo: renderConsumo,
    previsoes: renderPrevisoes,
    sugestoes: renderSugestoes,
    alertas: renderAlertas,
    relatorios: renderRelatorios,
    configuracoes: renderConfiguracoes,
};

async function navigateTo(page) {
    document.querySelectorAll(".nav-item[data-page]").forEach(a => {
        a.classList.toggle("active", a.dataset.page === page);
    });
    document.getElementById("sidebar").classList.remove("open");

    document.getElementById("page-title").textContent = PAGE_TITLES[page] || page;

    if (typeof destruirGraficos === "function") destruirGraficos();
    /* Cada tela comeca com as listas no limite padrao do "Ver mais". */
    if (typeof resetListas === "function") resetListas();

    document.getElementById("content-body").innerHTML =
        '<div class="text-center py-5"><div class="spinner-border"></div></div>';

    if (PAGE_RENDERERS[page]) await PAGE_RENDERERS[page]();
    else document.getElementById("content-body").innerHTML = "<h3>Pagina nao encontrada</h3>";
}

/* Icone do botao do cabecalho mostra para qual tema ele vai trocar. */
function atualizarBotaoTema() {
    const btn = document.getElementById("btn-alternar-tema");
    if (!btn) return;
    const claro = Preferencias.claro();
    btn.innerHTML = `<i class="bi ${claro ? "bi-moon-stars" : "bi-sun"}"></i>`;
    btn.title = claro ? "Mudar para o tema escuro" : "Mudar para o tema claro";
    btn.setAttribute("aria-label", btn.title);
}

/* Pagina inicial salva nas Configuracoes, se ainda for valida para o usuario. */
function paginaInicial() {
    const p = Preferencias.ler().paginaInicial;
    if (!PAGE_RENDERERS[p]) return "dashboard";
    if (p === "usuarios" && !(currentUser && currentUser.admin)) return "dashboard";
    return p;
}

async function initApp() {
    if (!API.getToken()) { window.location.href = "/web/login"; return; }

    const me = await API.me();
    if (!me.ok) {
        /* Token expirado (ex.: servidor reiniciado): volta para o login. */
        localStorage.removeItem("token");
        window.location.href = "/web/login";
        return;
    }
    currentUser = me.data;
    const greeting = document.getElementById("header-greeting");
    if (greeting) greeting.textContent = "Olá, " + currentUser.nome;
    if (!currentUser.admin) {
        const navUsuarios = document.getElementById("nav-usuarios");
        if (navUsuarios) navUsuarios.style.display = "none";
    }

    document.querySelectorAll("[data-page]").forEach(a => {
        a.addEventListener("click", function (e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });

    document.getElementById("btn-logout").addEventListener("click", async function (e) {
        e.preventDefault();
        await API.logout();
        localStorage.removeItem("token");
        window.location.href = "/web/login";
    });

    document.getElementById("btn-toggle-sidebar").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("open");
    });

    document.getElementById("btn-alternar-tema").addEventListener("click", function () {
        Preferencias.salvar({ tema: Preferencias.claro() ? "escuro" : "claro" });
    });

    /* O CSS troca sozinho pelas variaveis; os graficos (ApexCharts guarda
       as cores na criacao) sao repintados no lugar, sem perder o estado da
       tela. Se a mudanca veio do botao/outra aba com a tela de Configuracoes
       aberta, sincroniza a selecao do tema. */
    document.addEventListener("preferencias-alteradas", function (e) {
        atualizarBotaoTema();
        if (!e.detail || !e.detail.temaMudou) return;
        aplicarTemaGraficos();
        const cfg = Preferencias.ler();
        document.querySelectorAll(".tema-opcao").forEach(b => {
            b.classList.toggle("ativo", b.dataset.tema === cfg.tema);
            b.setAttribute("aria-pressed", String(b.dataset.tema === cfg.tema));
        });
    });
    atualizarBotaoTema();

    navigateTo(paginaInicial());
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
