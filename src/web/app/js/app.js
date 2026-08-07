let currentUser = null;

const PAGE_TITLES = {
    dashboard: "Dashboard", usuarios: "Usuarios", fornecedores: "Fornecedores",
    "materias-primas": "Materias-Primas", lotes: "Lotes", clientes: "Clientes",
    formulas: "Formulas", estoque: "Estoque", compras: "Compras",
    pedidos: "Pedidos", producao: "Producao", consumo: "Historico de Consumo",
    previsoes: "Previsoes de Consumo", sugestoes: "Sugestoes de Compra",
    alertas: "Alertas", relatorios: "Relatorios"
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
};

async function navigateTo(page) {
    document.querySelectorAll(".nav-item[data-page]").forEach(a => {
        a.classList.toggle("active", a.dataset.page === page);
    });
    document.getElementById("sidebar").classList.remove("open");

    document.getElementById("page-title").textContent = PAGE_TITLES[page] || page;

    document.getElementById("content-body").innerHTML =
        '<div class="text-center py-5"><div class="spinner-border"></div></div>';

    if (PAGE_RENDERERS[page]) await PAGE_RENDERERS[page]();
    else document.getElementById("content-body").innerHTML = "<h3>Pagina nao encontrada</h3>";
}

async function initApp() {
    if (!API.getToken()) { window.location.href = "/web/login"; return; }

    const me = await API.me();
    if (me.ok) {
        currentUser = me.data;
        const greeting = document.getElementById("header-greeting");
        if (greeting) greeting.textContent = "Olá, " + currentUser.nome;
    }
    if (me.ok && !currentUser.admin) {
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

    navigateTo("dashboard");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
