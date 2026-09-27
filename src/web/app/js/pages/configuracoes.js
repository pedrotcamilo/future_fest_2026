/* Configuracoes basicas do site. Tudo fica salvo neste navegador (via
   Preferencias, em /web/tema.js) e e aplicado na hora, sem botao salvar.

   Os nomes globais daqui usam o prefixo "config" para nao colidir com os
   outros scripts (todos dividem o mesmo escopo global — ver charts.js). */

const CONFIG_TEMAS = [
    { valor: "escuro", rotulo: "Escuro", icone: "bi-moon-stars" },
    { valor: "claro", rotulo: "Claro", icone: "bi-sun" },
    { valor: "sistema", rotulo: "Sistema", icone: "bi-circle-half" }
];

let configTimerSalvo = null;

function configItem(nome, ajuda, controle) {
    return `<div class="config-item">
        <div class="config-item-texto">
            <div class="config-item-nome">${nome}</div>
            ${ajuda ? `<div class="config-item-ajuda">${ajuda}</div>` : ""}
        </div>
        ${controle}
    </div>`;
}

function configSelect(id, opcoes, atual) {
    const opts = opcoes.map(o =>
        `<option value="${o.valor}" ${String(o.valor) === String(atual) ? "selected" : ""}>${o.rotulo}</option>`
    ).join("");
    return `<select class="form-select form-select-sm" id="${id}">${opts}</select>`;
}

function configSwitch(id, ligado, rotulo) {
    return `<div class="form-check form-switch m-0">
        <input class="form-check-input" type="checkbox" role="switch" id="${id}" ${ligado ? "checked" : ""} aria-label="${rotulo}">
    </div>`;
}

function configCartao(icone, titulo, desc, corpo) {
    return `<div class="config-card">
        <div class="config-card-titulo"><i class="bi ${icone}"></i> ${titulo}</div>
        <div class="config-card-desc">${desc}</div>
        ${corpo}
    </div>`;
}

/* Paginas que podem abrir ao entrar no sistema (usuarios so para admin). */
function configPaginasIniciais() {
    return Object.keys(PAGE_TITLES)
        .filter(p => p !== "configuracoes")
        .filter(p => p !== "usuarios" || (currentUser && currentUser.admin))
        .map(p => ({ valor: p, rotulo: PAGE_TITLES[p] }));
}

function configEscapar(t) {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
}

function configMostrarSalvo() {
    const el = document.getElementById("config-salvo");
    if (!el) return;
    el.classList.add("visivel");
    clearTimeout(configTimerSalvo);
    configTimerSalvo = setTimeout(() => el.classList.remove("visivel"), 1800);
}

function configSalvar(parcial) {
    Preferencias.salvar(parcial);
    configMostrarSalvo();
}

async function renderConfiguracoes() {
    const cfg = Preferencias.ler();

    const temas = CONFIG_TEMAS.map(t => `
        <button type="button" class="tema-opcao ${cfg.tema === t.valor ? "ativo" : ""}" data-tema="${t.valor}" aria-pressed="${cfg.tema === t.valor}">
            <div class="tema-mini ${t.valor}" aria-hidden="true">
                <div class="tema-mini-lado"></div>
                <div class="tema-mini-corpo">
                    <div class="tema-mini-topo"></div>
                    <div class="tema-mini-cards"><span></span><span></span></div>
                </div>
            </div>
            <div class="tema-opcao-rotulo"><i class="bi ${t.icone}"></i> ${t.rotulo}</div>
        </button>`).join("");

    const aparencia = configCartao("bi-palette", "Aparencia", "Tema, tamanho do texto e efeitos visuais.",
        `<div class="config-item">
            <div class="config-item-texto">
                <div class="config-item-nome">Tema</div>
                <div class="config-item-ajuda">"Sistema" acompanha o modo claro/escuro do seu computador.</div>
            </div>
            <div class="tema-opcoes" role="group" aria-label="Tema">${temas}</div>
        </div>` +
        configItem("Tamanho da fonte", "Aumenta ou reduz todo o texto do painel.",
            configSelect("config-fonte", [
                { valor: "pequena", rotulo: "Pequena" },
                { valor: "normal", rotulo: "Normal" },
                { valor: "grande", rotulo: "Grande" }
            ], cfg.fonte)) +
        configItem("Animacoes", "Transicoes da interface e animacao de entrada dos graficos.",
            configSwitch("config-animacoes", cfg.animacoes, "Animacoes")) +
        configItem("Tabelas compactas", "Linhas mais baixas para ver mais registros de uma vez.",
            configSwitch("config-compactas", cfg.tabelasCompactas, "Tabelas compactas"))
    );

    const navegacao = configCartao("bi-compass", "Navegacao", "Como o painel abre e exibe as listas.",
        configItem("Pagina inicial", "Tela aberta logo apos o login.",
            configSelect("config-pagina-inicial", configPaginasIniciais(), cfg.paginaInicial)) +
        configItem("Itens por lista", "Registros exibidos antes do \"Ver mais\".",
            configSelect("config-itens", [10, 15, 25, 50, 100].map(n => ({ valor: n, rotulo: n + " itens" })), cfg.itensPorLista))
    );

    const sessao = configCartao("bi-shield-lock", "Sessao", "Seguranca da sua sessao neste navegador.",
        configItem("Encerrar por inatividade", "Faz logout automatico apos este tempo sem uso.",
            configSelect("config-inatividade", [
                { valor: 1, rotulo: "1 minuto" },
                { valor: 5, rotulo: "5 minutos" },
                { valor: 15, rotulo: "15 minutos" },
                { valor: 30, rotulo: "30 minutos" }
            ], cfg.inatividadeMin))
    );

    const u = currentUser || {};
    const conta = configCartao("bi-person-circle", "Conta", "Usuario conectado nesta sessao.",
        configItem("Nome", "", `<span class="text-body-secondary">${configEscapar(u.nome || "-")}</span>`) +
        configItem("E-mail", "", `<span class="text-body-secondary text-break">${configEscapar(u.email || "-")}</span>`) +
        configItem("Perfil", "", u.admin
            ? '<span class="badge text-bg-primary">Administrador</span>'
            : '<span class="badge text-bg-secondary">Usuario</span>')
    );

    document.getElementById("content-body").innerHTML = `
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <div class="text-body-secondary small">
                <i class="bi bi-info-circle"></i> As preferencias sao aplicadas na hora e ficam salvas neste navegador.
            </div>
            <span class="config-salvo ms-2" id="config-salvo" role="status"><i class="bi bi-check2-circle"></i> Salvo</span>
            <button type="button" class="btn btn-sm btn-outline-secondary ms-auto" id="config-restaurar">
                <i class="bi bi-arrow-counterclockwise"></i> Restaurar padroes
            </button>
        </div>
        <div class="row g-3">
            <div class="col-xl-7">${aparencia}</div>
            <div class="col-xl-5 d-flex flex-column gap-3">${navegacao}${sessao}</div>
            <div class="col-12">${conta}</div>
        </div>`;

    document.querySelectorAll(".tema-opcao").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".tema-opcao").forEach(b => {
                b.classList.toggle("ativo", b === this);
                b.setAttribute("aria-pressed", String(b === this));
            });
            configSalvar({ tema: this.dataset.tema });
        });
    });

    const ligar = (id, evento, fn) => document.getElementById(id).addEventListener(evento, fn);
    ligar("config-fonte", "change", e => configSalvar({ fonte: e.target.value }));
    ligar("config-animacoes", "change", e => configSalvar({ animacoes: e.target.checked }));
    ligar("config-compactas", "change", e => configSalvar({ tabelasCompactas: e.target.checked }));
    ligar("config-pagina-inicial", "change", e => configSalvar({ paginaInicial: e.target.value }));
    ligar("config-itens", "change", e => configSalvar({ itensPorLista: Number(e.target.value) }));
    ligar("config-inatividade", "change", e => configSalvar({ inatividadeMin: Number(e.target.value) }));
    ligar("config-restaurar", "click", async () => {
        Preferencias.restaurar();
        await renderConfiguracoes();
        configMostrarSalvo();
    });
}
