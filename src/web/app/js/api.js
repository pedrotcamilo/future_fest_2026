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

  // Auth
  login(email, senha) { return this.post("/auth/login", { email, senha }); },
  logout() { return this.post("/auth/logout"); },
  me() { return this.get("/auth/me"); },

  // Usuarios
  listarUsuarios() { return this.get("/usuarios"); },
  buscarUsuario(id) { return this.get(`/usuarios/${id}`); },
  criarUsuario(d) { return this.post("/usuarios", d); },
  atualizarUsuario(id, d) { return this.put(`/usuarios/${id}`, d); },
  deletarUsuario(id) { return this.del(`/usuarios/${id}`); },

  // Fornecedores
  listarFornecedores(params) { return this.get(`/fornecedores${params ? "?"+params : ""}`); },
  buscarFornecedor(id) { return this.get(`/fornecedores/${id}`); },
  criarFornecedor(d) { return this.post("/fornecedores", d); },
  atualizarFornecedor(id, d) { return this.put(`/fornecedores/${id}`, d); },
  deletarFornecedor(id) { return this.del(`/fornecedores/${id}`); },

  // Materias Primas
  listarMateriasPrimas(params) { return this.get(`/materias-primas${params ? "?"+params : ""}`); },
  buscarMateriaPrima(id) { return this.get(`/materias-primas/${id}`); },
  criarMateriaPrima(d) { return this.post("/materias-primas", d); },
  atualizarMateriaPrima(id, d) { return this.put(`/materias-primas/${id}`, d); },
  deletarMateriaPrima(id) { return this.del(`/materias-primas/${id}`); },

  // Lotes
  listarLotes(params) { return this.get(`/lotes${params ? "?"+params : ""}`); },
  buscarLote(id) { return this.get(`/lotes/${id}`); },
  criarLote(d) { return this.post("/lotes", d); },
  atualizarLote(id, d) { return this.put(`/lotes/${id}`, d); },
  deletarLote(id) { return this.del(`/lotes/${id}`); },

  // Estoque
  consultarEstoque() { return this.get("/estoque"); },
  consultarEstoqueMP(id) { return this.get(`/estoque/${id}`); },
  registrarMovimentacao(d) { return this.post("/estoque/movimentacoes", d); },
  listarMovimentacoes() { return this.get("/estoque/movimentacoes"); },

  // Compras
  listarCompras() { return this.get("/compras"); },
  buscarCompra(id) { return this.get(`/compras/${id}`); },
  criarCompra(d) { return this.post("/compras", d); },
  atualizarCompra(id, d) { return this.put(`/compras/${id}`, d); },
  deletarCompra(id) { return this.del(`/compras/${id}`); },
  receberCompra(id) { return this.post(`/compras/${id}/receber`); },
  cancelarCompra(id) { return this.post(`/compras/${id}/cancelar`); },
  adicionarItemCompra(id, d) { return this.post(`/compras/${id}/itens`, d); },

  // Formulas
  listarFormulas() { return this.get("/formulas"); },
  buscarFormula(id) { return this.get(`/formulas/${id}`); },
  criarFormula(d) { return this.post("/formulas", d); },
  atualizarFormula(id, d) { return this.put(`/formulas/${id}`, d); },
  deletarFormula(id) { return this.del(`/formulas/${id}`); },
  listarItensFormula(id) { return this.get(`/formulas/${id}/itens`); },
  adicionarItemFormula(id, d) { return this.post(`/formulas/${id}/itens`, d); },
  atualizarItemFormula(id, itemId, d) { return this.put(`/formulas/${id}/itens/${itemId}`, d); },
  deletarItemFormula(id, itemId) { return this.del(`/formulas/${id}/itens/${itemId}`); },

  // Clientes
  listarClientes() { return this.get("/clientes"); },
  buscarCliente(id) { return this.get(`/clientes/${id}`); },
  criarCliente(d) { return this.post("/clientes", d); },
  atualizarCliente(id, d) { return this.put(`/clientes/${id}`, d); },
  deletarCliente(id) { return this.del(`/clientes/${id}`); },

  // Pedidos
  listarPedidos() { return this.get("/pedidos"); },
  buscarPedido(id) { return this.get(`/pedidos/${id}`); },
  criarPedido(d) { return this.post("/pedidos", d); },
  atualizarPedido(id, d) { return this.put(`/pedidos/${id}`, d); },
  deletarPedido(id) { return this.del(`/pedidos/${id}`); },
  adicionarItemPedido(id, d) { return this.post(`/pedidos/${id}/itens`, d); },

  // Producao
  listarOrdens() { return this.get("/ordens-producao"); },
  buscarOrdem(id) { return this.get(`/ordens-producao/${id}`); },
  criarOrdem(d) { return this.post("/ordens-producao", d); },
  atualizarOrdem(id, d) { return this.put(`/ordens-producao/${id}`, d); },
  deletarOrdem(id) { return this.del(`/ordens-producao/${id}`); },
  iniciarOrdem(id) { return this.post(`/ordens-producao/${id}/iniciar`); },
  finalizarOrdem(id) { return this.post(`/ordens-producao/${id}/finalizar`); },
  cancelarOrdem(id) { return this.post(`/ordens-producao/${id}/cancelar`); },
  registrarConsumo(id, d) { return this.post(`/ordens-producao/${id}/consumos`, d); },

  // Consumo
  listarConsumos(params) { return this.get(`/consumos${params ? "?"+params : ""}`); },

  // Previsoes
  listarPrevisoes() { return this.get("/previsoes"); },
  previsoesMP(id) { return this.get(`/previsoes/materia-prima/${id}`); },
  gerarPrevisao(d) { return this.post("/previsoes/gerar", d); },

  // Sugestoes
  listarSugestoes() { return this.get("/sugestoes-compra"); },
  gerarSugestoes() { return this.post("/sugestoes-compra/gerar"); },
  aprovarSugestao(id) { return this.post(`/sugestoes-compra/${id}/aprovar`); },
  rejeitarSugestao(id) { return this.post(`/sugestoes-compra/${id}/rejeitar`); },

  // Alertas
  listarAlertas(params) { return this.get(`/alertas${params ? "?"+params : ""}`); },
  resolverAlerta(id) { return this.post(`/alertas/${id}/resolver`); },

  // Dashboard
  dashboard() { return this.get("/dashboard"); },
  dashboardEstoque() { return this.get("/dashboard/estoque"); },
  dashboardCompras() { return this.get("/dashboard/compras"); },
  dashboardProducao() { return this.get("/dashboard/producao"); },
  dashboardPrevisoes() { return this.get("/dashboard/previsoes"); },
  dashboardAlertas() { return this.get("/dashboard/alertas"); },

  // Relatorios
  relatorioConsumo(params) { return this.get(`/relatorios/consumo${params ? "?"+params : ""}`); },
  relatorioEstoque() { return this.get("/relatorios/estoque"); },
  relatorioVencimentos() { return this.get("/relatorios/vencimentos"); },
  relatorioCompras(params) { return this.get(`/relatorios/compras${params ? "?"+params : ""}`); },
  relatorioProducao(params) { return this.get(`/relatorios/producao${params ? "?"+params : ""}`); },
  relatorioPrevisoes() { return this.get("/relatorios/previsoes"); },
};
