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
    // Tokens vivem na memoria do servidor: apos um restart (ou logout em
    // outra aba) todas as rotas respondem 401 — volta para o login.
    if (res.status === 401 && !path.startsWith("/auth/")) {
      localStorage.removeItem("token");
      window.location.href = "/web/login";
      return { ok: false, data };
    }
    // As paginas tratam falha como lista vazia (GET) ou fecham o modal como se
    // tivesse salvo (POST/PUT/DELETE); sem este aviso o erro passava calado.
    if (!res.ok && !path.startsWith("/auth/")) this.avisarErro(method, path, res.status, data);
    return { ok: res.ok, data };
  },

  mensagemErro(data) {
    const detalhe = data && typeof data === "object" ? (data.erro || data.detail || data.mensagem || data.message) : data;
    return typeof detalhe === "string" ? detalhe.slice(0, 200) : "";
  },

  avisarErro(method, path, status, data) {
    const texto = this.mensagemErro(data);
    const leitura = method === "GET";
    let box = document.getElementById("api-erros");
    if (!box) {
      box = document.createElement("div");
      box.id = "api-erros";
      box.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2000;max-width:min(420px,calc(100vw - 32px))";
      document.body.appendChild(box);
    }
    const chave = method + " " + path;
    if (box.querySelector(`[data-path="${CSS.escape(chave)}"]`)) return;
    const el = document.createElement("div");
    el.className = "alert alert-danger alert-dismissible shadow-sm mb-2 small";
    el.dataset.path = chave;
    el.setAttribute("role", "alert");
    el.innerHTML = `<strong>${leitura ? "Erro ao carregar dados" : "Erro ao salvar"}</strong> (HTTP ${status})<br><code></code><div></div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>`;
    el.querySelector("code").textContent = chave;
    el.querySelector("div").textContent = texto ||
      (leitura ? "A lista pode aparecer vazia por causa desta falha." : "A operacao nao foi concluida.");
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
