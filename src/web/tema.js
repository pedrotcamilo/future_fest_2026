/* Preferencias do usuario (tema, fonte, listas, sessao), guardadas neste
   navegador. Carregado SINCRONO no <head> do app e do login: aplica o tema
   antes do primeiro paint, entao a tela nao "pisca" escura antes de ficar
   clara.

   Expoe window.Preferencias; quem precisar reagir a mudancas escuta o
   evento "preferencias-alteradas" no document (detail.temaMudou indica se
   o tema efetivo claro/escuro trocou). */
(function () {
    const CHAVE = "axionphare-config";

    const PADRAO = {
        tema: "escuro",          /* escuro | claro | sistema */
        fonte: "normal",         /* pequena | normal | grande */
        animacoes: true,
        tabelasCompactas: false,
        paginaInicial: "dashboard",
        itensPorLista: 15,
        inatividadeMin: 1
    };

    const midiaClara = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

    function ler() {
        let salvo = null;
        try { salvo = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { }
        return Object.assign({}, PADRAO, salvo && typeof salvo === "object" ? salvo : {});
    }

    /* "sistema" segue o sistema operacional; o resto e fixo. */
    function temaEfetivo(tema) {
        if (tema === "sistema") return midiaClara && midiaClara.matches ? "light" : "dark";
        return tema === "claro" ? "light" : "dark";
    }

    function aplicar(cfg) {
        const raiz = document.documentElement;
        raiz.setAttribute("data-bs-theme", temaEfetivo(cfg.tema));
        raiz.setAttribute("data-fonte", cfg.fonte);
        raiz.classList.toggle("sem-animacoes", !cfg.animacoes);
        raiz.classList.toggle("tabelas-compactas", !!cfg.tabelasCompactas);
    }

    function avisar(temaAnterior) {
        document.dispatchEvent(new CustomEvent("preferencias-alteradas", {
            detail: { temaMudou: temaAnterior !== document.documentElement.getAttribute("data-bs-theme") }
        }));
    }

    function salvar(parcial) {
        const anterior = document.documentElement.getAttribute("data-bs-theme");
        const cfg = Object.assign(ler(), parcial);
        try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch (e) { }
        aplicar(cfg);
        avisar(anterior);
        return cfg;
    }

    function restaurar() {
        const anterior = document.documentElement.getAttribute("data-bs-theme");
        try { localStorage.removeItem(CHAVE); } catch (e) { }
        aplicar(PADRAO);
        avisar(anterior);
        return Object.assign({}, PADRAO);
    }

    if (midiaClara) {
        midiaClara.addEventListener("change", function () {
            const cfg = ler();
            if (cfg.tema !== "sistema") return;
            const anterior = document.documentElement.getAttribute("data-bs-theme");
            aplicar(cfg);
            avisar(anterior);
        });
    }

    /* Outra aba mudou as preferencias: acompanha. */
    window.addEventListener("storage", function (e) {
        if (e.key !== CHAVE && e.key !== null) return;
        const anterior = document.documentElement.getAttribute("data-bs-theme");
        aplicar(ler());
        avisar(anterior);
    });

    window.Preferencias = {
        PADRAO,
        ler,
        salvar,
        restaurar,
        temaEfetivo,
        claro() { return document.documentElement.getAttribute("data-bs-theme") === "light"; }
    };

    aplicar(ler());
})();
