window.onload = async function () {
    const req = await fetch("/diagnosticos/informacao_servidor");
    const body = await req.text();
    document.getElementById("info-servidor").textContent = body;
};

document.getElementById("btn-autenticar").addEventListener("click", login);
document.getElementById("senha").addEventListener("keydown", function(e) {
    if (e.key === "Enter") login();
});

document.getElementById("btn-esconder-senha").addEventListener("click", function() {
    const s = document.getElementById("senha");
    s.type = s.type === "password" ? "text" : "password";
});

async function login() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const msg = document.getElementById("login-msg");
    const btn = document.getElementById("btn-autenticar");
    const btnText = btn.querySelector(".btn-text");
    const btnLoading = btn.querySelector(".btn-loading");

    if (!email || !senha) {
        msg.textContent = "Preencha email e senha.";
        return;
    }

    btn.disabled = true;
    btnText.classList.add("d-none");
    btnLoading.classList.remove("d-none");
    msg.textContent = "";

    try {
        const res = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();

        if (data.status === "Autenticado" && data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "/web/app.html";
        } else {
            msg.textContent = "Email ou senha incorretos.";
        }
    } catch (err) {
        msg.textContent = "Erro de conexao com o servidor.";
    } finally {
        btn.disabled = false;
        btnText.classList.remove("d-none");
        btnLoading.classList.add("d-none");
    }
}
