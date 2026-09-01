# AxionPhare — Sistema de Gestão para Farmácias de Manipulação

## O que é

O **AxionPhare** é um sistema completo de gestão de estoque e operação para **farmácias de manipulação de pequeno porte**. Em vez de planilhas e cadernos, a farmácia ganha uma ferramenta única que acompanha cada insumo desde a compra até a entrega da fórmula pronta ao paciente — sempre sabendo o que tem em estoque, o que falta, o que está vencendo e o que precisa ser comprado.

## O problema

Farmácias de manipulação lidam com centenas de matérias-primas, lotes com datas de validade diferentes e produção sob demanda. Sem controle adequado:

- **Perda de dinheiro** com insumos que vencem e são descartados;
- **Faltas de material** que atrasam a entrega de fórmulas aos pacientes;
- **Decisões de compra no "achismo"**, sem saber o consumo real;
- Dependência de planilhas manuais, sujeitas a erro e sem visão geral.

## O que o sistema resolve

Em uma única plataforma, o AxionPhare permite à farmácia:

1. **Conhecer o estoque em tempo real** — quanto há de cada matéria-prima e em quais lotes, por validade.
2. **Controlar a validade dos lotes** — saber antecipadamente o que vai vencer, priorizando o uso do que vence primeiro (princípio FEFO).
3. **Acompanhar compras e fornecedores** — do pedido ao recebimento, com prazo de entrega por fornecedor.
4. **Gerenciar fórmulas e produção** — relacionar fórmulas magistrais, pedidos de clientes e ordens de produção, com baixa automática do material usado.
5. **Receber sugestões inteligentes de compra** — o sistema aponta, de forma automática, quais insumos estão abaixo do mínimo e quanto repor.
6. **Gerar previsões de consumo** — projeções por matéria-prima para planejar compras com antecedência.
7. **Alertar sobre riscos** — falta de material, estoque baixo e vencimento próximo, com prioridade.
8. **Visualizar o negócio** — dashboard com indicadores e relatórios de consumo, estoque, compras, produção e previsões.

## Para quem é

**Farmacêuticos e donos de farmácias de manipulação de pequeno e médio porte** que querem sair do controle manual para um sistema simples, intuitivo e barato — sem complexidade de ERPs corporativos grandes e caros.

## Diferenciais

- **Simples e acessível**: interface amigável, em português, pensada para o dia a dia da farmácia.
- **Feito para a realidade da manipulação**: lote, validade, fórmula e produção sob demanda — não um sistema de estoque genérico.
- **Inteligência prática**: sugestões de reposição e previsões de consumo que ajudam a comprar certo e evitar desperdício.
- **Fácil de implantar**: pode rodar na própria infraestrutura da farmácia, sem dependência de servidores externos.

## Como funciona na prática

1. A farmácia cadastra fornecedores, matérias-primas e fórmulas.
2. Compras são lançadas e, ao receber, o sistema cria os lotes e atualiza o estoque automaticamente.
3. Quando chega um pedido do cliente, abre-se uma ordem de produção; ao produzir, o consumo dos insumos é baixado do estoque na hora.
4. O sistema analisa o histórico, sugere compras e emite alertas de falta e vencimento.
5. O gestor acompanha tudo em um painel com indicadores e relatórios.

## Estágio atual

O sistema está **funcional e modularizado**, com todos os módulos principais implementados (cadastros, estoque, compras, produção, previsões, alertas, dashboard e relatórios), banco de dados pronto, tela de login, dados de demonstração e suporte a instalação via Docker. É uma base sólida, pronta para evoluir com recursos como emissão de documentos fiscais, geração de relatórios em PDF/Excel, integração com ERPs e notificações por e-mail e WhatsApp.

## Próximos passos possíveis

- Aprofundar a inteligência de previsão de demanda com modelos de machine learning.
- Notificações automáticas por e-mail/WhatsApp de alertas e sugestões.
- Relatórios exportáveis (PDF/Excel) e emissão de NF-e.
- Versão multi-farmácia (cloud) com assinatura mensal.

---

*AxionPhare — gestão simples e inteligente para farmácias de manipulação.*