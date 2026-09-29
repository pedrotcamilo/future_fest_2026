const API = {
  getToken() {
    return localStorage.getItem("token");
  },

  async request(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : await res.text();
    // As paginas tratam falha como lista vazia; sem este aviso um 500 aparecia
    // como "Nenhum registro encontrado." e parecia falta de dados.
    if (!res.ok && method === "GET" && path !== "/auth/me") this.avisarErro(path, res.status, data);
    return { ok: res.ok, data };
  },

  avisarErro(path, status, data) {
    const detalhe = data && typeof data === "object" ? (data.detail || data.mensagem || data.message) : data;
    const texto = typeof detalhe === "string" ? detalhe.slice(0, 200) : "";
    let box = document.getElementById("api-erros");
    if (!box) {
      box = document.createElement("div");
      box.id = "api-erros";
      box.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2000;max-width:min(420px,calc(100vw - 32px))";
      document.body.appendChild(box);
    }
    if (box.querySelector(`[data-path="${CSS.escape(path)}"]`)) return;
    const el = document.createElement("div");
    el.className = "alert alert-danger alert-dismissible shadow-sm mb-2 small";
    el.dataset.path = path;
    el.setAttribute("role", "alert");
    el.innerHTML = `<strong>Erro ao carregar dados</strong> (HTTP ${status})<br><code></code><div></div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>`;
    el.querySelector("code").textContent = path;
    el.querySelector("div").textContent = texto || "A lista pode aparecer vazia por causa desta falha.";
    box.appendChild(el);
    setTimeout(() => el.remove(), 15000);
  },

  get(path) { return this.request("GET", path); },
  post(path, body) { return this.request("POST", path, body); },
  put(path, body) { return this.request("PUT", path, body); },
  del(path) { return this.request("DELETE", path); },
};

Object.assign(API, {
  login(email, senha) { return this.post("/auth/login", { email, senha }); },
  logout() { return this.post("/auth/logout"); },
  me() { return this.get("/auth/me"); },
});
