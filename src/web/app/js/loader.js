(function () {
    const SCRIPTS = [
        "app/js/api/client.js",
        "app/js/api/cadastros.js",
        "app/js/api/operacoes.js",
        "app/js/api/analise.js",
        "app/js/api/dashboard.js",
        "app/js/core/ui.js",
        "app/js/core/inactivity.js",
        "app/js/pages/dashboard.js",
        "app/js/pages/usuarios.js",
        "app/js/pages/fornecedores.js",
        "app/js/pages/materias-primas.js",
        "app/js/pages/lotes.js",
        "app/js/pages/clientes.js",
        "app/js/pages/formulas.js",
        "app/js/pages/estoque.js",
        "app/js/pages/compras.js",
        "app/js/pages/pedidos.js",
        "app/js/pages/producao.js",
        "app/js/pages/consumo.js",
        "app/js/pages/previsoes.js",
        "app/js/pages/sugestoes.js",
        "app/js/pages/alertas.js",
        "app/js/pages/relatorios.js",
        "app/js/app.js"
    ];

    const CACHE_NAME = "future-fest-scripts-v2";
    const LS_PREFIX = "future-fest-scripts-v2:";

    const splash = document.getElementById("app-splash");
    const statusEl = document.getElementById("app-splash-status");
    const barEl = document.getElementById("app-splash-bar");

    let loadFailed = false;

    if (typeof caches !== "undefined") {
        try { caches.delete("future-fest-scripts-v1"); } catch (e) { }
        Object.keys(localStorage)
            .filter(k => k.startsWith("future-fest-scripts-v1:"))
            .forEach(k => localStorage.removeItem(k));
    }

    function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
    }

    function setProgress(pct) {
        if (barEl) barEl.style.width = pct + "%";
    }

    function showError(msg) {
        if (statusEl) {
            statusEl.textContent = msg;
            statusEl.classList.add("text-danger");
        }
    }

    function hideSplash() {
        if (splash) {
            splash.classList.add("hidden");
            splash.style.display = "none";
        }
    }

    window.addEventListener("error", function (e) {
        if (!splash || splash.classList.contains("hidden")) return;
        loadFailed = true;
        const file = (e.filename || "").split("/").pop();
        showError("Erro em " + file + ": " + e.message);
    });

    const cacheStore = {
        async get(path) {
            if (typeof caches !== "undefined") {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    const res = await cache.match(path);
                    if (res) return await res.text();
                } catch (e) { }
            }
            return localStorage.getItem(LS_PREFIX + path);
        },
        async put(path, text) {
            if (typeof caches !== "undefined") {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(path, new Response(text, {
                        headers: { "Content-Type": "application/javascript" }
                    }));
                    return;
                } catch (e) { }
            }
            localStorage.setItem(LS_PREFIX + path, text);
        }
    };

    async function fetchText(path) {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status + " em " + path);
        return await res.text();
    }

    async function getScriptText(path) {
        const cached = await cacheStore.get(path);
        if (cached != null) {
            fetchText(path).then(t => cacheStore.put(path, t)).catch(() => {});
            return cached;
        }
        const text = await fetchText(path);
        await cacheStore.put(path, text);
        return text;
    }

    function executeScript(text) {
        const el = document.createElement("script");
        el.textContent = text;
        document.head.appendChild(el);
    }

    async function loadAll() {
        const total = SCRIPTS.length;
        let loaded = 0;
        for (const path of SCRIPTS) {
            setStatus("Carregando " + path.split("/").pop());
            const text = await getScriptText(path);
            executeScript(text);
            loaded++;
            setProgress(Math.round((loaded / total) * 100));
        }
        setStatus("Aplicacao pronta");
        setProgress(100);
    }

    loadAll().then(() => {
        if (loadFailed) return;
        hideSplash();
    }).catch(function (e) {
        showError("Erro ao carregar scripts: " + (e && e.message ? e.message : e));
    });
})();
