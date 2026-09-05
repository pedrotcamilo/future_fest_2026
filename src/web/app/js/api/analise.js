Object.assign(API, {
  listarPrevisoes() { return this.get("/previsoes"); },
  previsoesMP(id) { return this.get(`/previsoes/materia-prima/${id}`); },
  gerarPrevisao(d) { return this.post("/previsoes/gerar", d); },
  gerarPrevisaoAutomatica(params) { return this.post(`/previsoes/gerar-automatica${params ? "?"+params : ""}`); },

  listarSugestoes() { return this.get("/sugestoes-compra"); },
  gerarSugestoes() { return this.post("/sugestoes-compra/gerar"); },
  aprovarSugestao(id) { return this.post(`/sugestoes-compra/${id}/aprovar`); },
  rejeitarSugestao(id) { return this.post(`/sugestoes-compra/${id}/rejeitar`); },

  listarAlertas(params) { return this.get(`/alertas${params ? "?"+params : ""}`); },
  resolverAlerta(id) { return this.post(`/alertas/${id}/resolver`); },
});
