Object.assign(API, {
  dashboard() { return this.get("/dashboard"); },
  dashboardEstoque() { return this.get("/dashboard/estoque"); },
  dashboardCompras() { return this.get("/dashboard/compras"); },
  dashboardProducao() { return this.get("/dashboard/producao"); },
  dashboardPrevisoes() { return this.get("/dashboard/previsoes"); },
  dashboardAlertas() { return this.get("/dashboard/alertas"); },

  relatorioConsumo(params) { return this.get(`/relatorios/consumo${params ? "?"+params : ""}`); },
  relatorioEstoque() { return this.get("/relatorios/estoque"); },
  relatorioVencimentos() { return this.get("/relatorios/vencimentos"); },
  relatorioCompras(params) { return this.get(`/relatorios/compras${params ? "?"+params : ""}`); },
  relatorioProducao(params) { return this.get(`/relatorios/producao${params ? "?"+params : ""}`); },
  relatorioPrevisoes() { return this.get("/relatorios/previsoes"); },
});
