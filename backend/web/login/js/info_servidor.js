window.onload = async function () {
    const request = await fetch("/diagnosticos/informacao_servidor");
    const body = await request.text();
    const info_servidor_e = document.getElementById("info-servidor");

    info_servidor_e.textContent = body;
}