async function conectarServidor() {
    if (!window.apiConfig) return;

    const { servidor, porta } = await window.apiConfig.obterServidor();
    if (!servidor) return;

    const { valido, url } = await window.apiConfig.validarServidor(servidor, porta);
    if (valido && url) {
        window.location.href = `${url}/web`;
    }
}

const paginaInicial = window.location.pathname.endsWith("index.html");

if (paginaInicial) {
    const botaoConfig = document.getElementById("config-conexao");

    botaoConfig.addEventListener("click", () => {
        window.location.href = "config.html";
    })

    conectarServidor();
}
