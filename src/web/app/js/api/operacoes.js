Object.assign(API, {
  consultarEstoque() { return this.get("/estoque"); },
  consultarEstoqueMP(id) { return this.get(`/estoque/${id}`); },
  registrarMovimentacao(d) { return this.post("/estoque/movimentacoes", d); },
  listarMovimentacoes() { return this.get("/estoque/movimentacoes"); },

  listarCompras() { return this.get("/compras"); },
  buscarCompra(id) { return this.get(`/compras/${id}`); },
  criarCompra(d) { return this.post("/compras", d); },
  atualizarCompra(id, d) { return this.put(`/compras/${id}`, d); },
  deletarCompra(id) { return this.del(`/compras/${id}`); },
  receberCompra(id) { return this.post(`/compras/${id}/receber`); },
  cancelarCompra(id) { return this.post(`/compras/${id}/cancelar`); },
  adicionarItemCompra(id, d) { return this.post(`/compras/${id}/itens`, d); },

  listarPedidos() { return this.get("/pedidos"); },
  buscarPedido(id) { return this.get(`/pedidos/${id}`); },
  criarPedido(d) { return this.post("/pedidos", d); },
  atualizarPedido(id, d) { return this.put(`/pedidos/${id}`, d); },
  deletarPedido(id) { return this.del(`/pedidos/${id}`); },
  adicionarItemPedido(id, d) { return this.post(`/pedidos/${id}/itens`, d); },

  listarOrdens() { return this.get("/ordens-producao"); },
  buscarOrdem(id) { return this.get(`/ordens-producao/${id}`); },
  criarOrdem(d) { return this.post("/ordens-producao", d); },
  atualizarOrdem(id, d) { return this.put(`/ordens-producao/${id}`, d); },
  deletarOrdem(id) { return this.del(`/ordens-producao/${id}`); },
  iniciarOrdem(id) { return this.post(`/ordens-producao/${id}/iniciar`); },
  finalizarOrdem(id) { return this.post(`/ordens-producao/${id}/finalizar`); },
  cancelarOrdem(id) { return this.post(`/ordens-producao/${id}/cancelar`); },
  registrarConsumo(id, d) { return this.post(`/ordens-producao/${id}/consumos`, d); },

  listarConsumos(params) { return this.get(`/consumos${params ? "?"+params : ""}`); },
});
