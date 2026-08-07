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
    if (ct.includes("application/json")) return { ok: res.ok, data: await res.json() };
    const text = await res.text();
    return { ok: res.ok, data: text };
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
