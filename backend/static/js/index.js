const notif_msg = document.getElementById("notif-msg");
var emailsCarregadosReset = [];
var usuariosCarregadosLista = [];

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

        if (response.ok) {
            exibirNotificacao("Usuario criado com sucesso");
        } else {
            exibirNotificacao("Falha ao criar usuario!");
        }
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
                method: "DELETE"
                
            }
        );

        const texto = await response.text();
        if (response.ok) {
            exibirNotificacao("Usuario apagado com sucesso!");
        } else {
            exibirNotificacao("Erro ao apagar o usuario");
        }
    } catch (erro) {
        console.error("Erro:", erro);
        exibirNotificacao("Erro ao apagar o usuario, verifique o console.");
    } finally {
        habilitarDesabilitarInputs(false);
    }
}

function adicionarCodigoReset(email, codigo) {
    const container = document.getElementById("codigos-reset");
    const card = `
        <div class="card p-1 mt-2" style="width: 30vw;">
            <div class="card-body d-flex">
                <b class="card-title">${email}</b>
                <b class="position-absolute end-0 text-primary me-3">${codigo}</b>
            </div>
        </div>
    `;

    if (!emailsCarregadosReset.includes(email)) {
        container.innerHTML += card;
        emailsCarregadosReset.push(email);
    }
}

async function lerCodigosReset() {
    try {
        const response = await fetch("/codigosReset");
        const data = await response.json();

        for (const key in data) {
            adicionarCodigoReset(key, data[key]);
        }
    } catch(erro) {
        console.error(erro)
    }
}

function adicionarUsuario(nome, email, id) {
    const container = document.getElementById("lista-usuarios");
    const card = `
        <div class="card p-1 mt-2" style="width: 30vw;">
            <div class="card-body">
                <b class="card-title">(ID: ${id}) ${nome}</b>
                <p class="card-text">${email}</p>
            </div>
        </div>
    `;

    if (!usuariosCarregadosLista.includes(id)) {
        container.innerHTML += card;
        usuariosCarregadosLista.push(id);
    }
}

async function lerUsuarios() {
    try {
        const response = await fetch("/listarUsuarios");
        const data = await response.json();

        data.forEach(user => {
            adicionarUsuario(user.nome, user.email, user.id);
        });
    } catch (erro) {
        console.error(erro)
    }
}

function limparListas() {
    emailsCarregadosReset = [];
    usuariosCarregadosLista = [];
    document.getElementById("lista-usuarios").innerHTML = null;
    document.getElementById("codigos-reset").innerHTML = null;
}

lerCodigosReset();
lerUsuarios();

setInterval(() => {
    limparListas();
}, 4900);

setInterval(() => {
    lerCodigosReset();
    lerUsuarios();
}, 5000);
exibirNotificacao("Carregado com sucesso!")