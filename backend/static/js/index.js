const notif_msg = document.getElementById("notif-msg");

function exibirNotificacao(texto) {
    notif_msg.innerHTML = texto;
    setTimeout(() => {
        notif_msg.innerHTML = "";
    }, 1500);
}

function habilitarDesabilitarInputs(desabilitar) {
    const botoes = document.getElementsByTagName("button");
    const inputs = document.getElementsByTagName("input");

    if (desabilitar) {
        for (let i=0; i < botoes.length; i++) { botoes[i].disabled = true }
        for (let i=0; i < inputs.length; i++) { inputs[i].disabled = true }
    } else {
        for (let i=0; i < botoes.length; i++) { botoes[i].disabled = false }
        for (let i=0; i < inputs.length; i++) { inputs[i].disabled = false }
    }
}

async function criarUsuario() {
    habilitarDesabilitarInputs(true);

    const email = document.getElementById("email-criarusuario").value;
    const nome = document.getElementById("nome-criarusuario").value;
    const senha = document.getElementById("senha-criarusuario").value;

    try {
        const response = await fetch(
            `/registrarUsuario?email=${encodeURIComponent(email)}&nome=${encodeURIComponent(nome)}&senha=${encodeURIComponent(senha)}`,
            {
                method: "POST"
            }
        );

        const texto = await response.text();
        exibirNotificacao("Usuario criado com sucesso");
    } catch (erro) {
        console.error("Erro:", erro);
        exibirNotificacao("Erro ao criar o usuario, verifique o console.");
    } finally {
        habilitarDesabilitarInputs(false);
    }
}

async function apagarUsuario() {
    habilitarDesabilitarInputs(true);

    const id = document.getElementById("id-apagarusuario").value;

    try {
        const response = await fetch(
            `/apagarUsuario?id=${encodeURIComponent(id)}`,
            {
                method: "POST"
            }
        );

        const texto = await response.text();
        exibirNotificacao("Ação de apagar realizada.");
    } catch (erro) {
        console.error("Erro:", erro);
        exibirNotificacao("Erro ao apagar o usuario, verifique o console.");
    } finally {
        habilitarDesabilitarInputs(false);
    }
}

exibirNotificacao("Carregado com sucesso!")