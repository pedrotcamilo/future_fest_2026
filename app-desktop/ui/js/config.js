const campoServidor = document.getElementById("field-endereco-servidor");
const campoPorta = document.getElementById("field-porta-servidor");
const msgAviso = document.getElementById("msg-aviso");
const botaoSalvar = document.getElementById("btn-salvar");

const MSG_INVALIDO = "Servidor AxionPhare não detectado...";
const MSG_VALIDO = "Servidor valido";
const MSG_VERIFICANDO = "Verificando servidor...";

function mostrarStatus(valido) {
    msgAviso.classList.toggle("text-danger", !valido);
    msgAviso.classList.toggle("text-success", valido);
    msgAviso.classList.toggle("text-warning", false);
    msgAviso.textContent = valido ? MSG_VALIDO : MSG_INVALIDO;
}

function mostrarVerificando() {
    msgAviso.classList.toggle("text-danger", false);
    msgAviso.classList.toggle("text-success", false);
    msgAviso.classList.toggle("text-warning", true);
    msgAviso.textContent = MSG_VERIFICANDO;
}

async function validarESalvar() {
    const servidor = campoServidor.value.trim();
    const porta = campoPorta.value.trim();

    botaoSalvar.disabled = true;
    mostrarVerificando();

    try {
        const { valido } = await window.apiConfig.validarServidor(servidor, porta);

        if (valido) {
            await window.apiConfig.alterarServidor(servidor, porta);
        }

        mostrarStatus(valido);
    } catch (erro) {
        mostrarStatus(false);
    } finally {
        botaoSalvar.disabled = false;
    }
}

async function carregarServidor() {
    if (!window.apiConfig) return;

    const { servidor, porta } = await window.apiConfig.obterServidor();
    campoServidor.value = servidor ?? "";
    campoPorta.value = porta ?? "";

    if (campoServidor.value) {
        await validarESalvar();
    } else {
        mostrarStatus(false);
    }
}

botaoSalvar.addEventListener("click", async () => {
    if (!window.apiConfig) return;
    await validarESalvar();
});

document.getElementById("btn-resetar").addEventListener("click", async () => {
    if (!window.apiConfig) return;

    await window.apiConfig.resetarServidor();
    campoServidor.value = "";
    campoPorta.value = "";
    mostrarStatus(false);
});

document.getElementById("config-retornar").addEventListener("click", () => {
    window.location.href = "index.html";
})

carregarServidor();
