import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './scss/FeaturesSection.scss';

const features = [
  {
    icon: 'bi-box-seam',
    title: 'Estoque em Tempo Real',
    description: 'Saiba quanto há de cada matéria-prima e em quais lotes, por validade.'
  },
  {
    icon: 'bi-clock-history',
    title: 'Controle de Validade',
    description: 'Saber antecipadamente o que vai vencer, priorizando o uso do que vence primeiro (FEFO).'
  },
  {
    icon: 'bi-cart-check',
    title: 'Compras e Fornecedores',
    description: 'Do pedido ao recebimento, com prazo de entrega por fornecedor.'
  },
  {
    icon: 'bi-flask',
    title: 'Fórmulas e Produção',
    description: 'Relacionar fórmulas magistrais, pedidos e ordens de produção com baixa automática.'
  },
  {
    icon: 'bi-lightbulb',
    title: 'Sugestões Inteligentes',
    description: 'O sistema aponta automaticamente quais insumos estão abaixo do mínimo.'
  },
  {
    icon: 'bi-bar-chart-line',
    title: 'Previsões de Consumo',
    description: 'Projeções por matéria-prima para planejar compras com antecedência.'
  },
  {
    icon: 'bi-exclamation-triangle',
    title: 'Alertas de Risco',
    description: 'Falta de material, estoque baixo e vencimento próximo, com prioridade.'
  },
  {
    icon: 'bi-graph-up',
    title: 'Dashboard e Relatórios',
    description: 'Indicadores de consumo, estoque, compras, produção e previsões.'
  }
];

function FeaturesSection() {
  const sectionRef = useScrollReveal();

  return (
    <section className="features" id="funcionalidades" ref={sectionRef}>
      <div className="features__container">
        <h2 className="features__title reveal">
          O que o sistema <span>resolve</span>
        </h2>
        <p className="features__subtitle reveal">
          Em uma única plataforma, o AxionPhare permite à farmácia:
        </p>
        <div className="features__grid">
          {features.map((feature, index) => (
            <div key={index} className="features__card reveal" style={{ transitionDelay: `${index * 0.08}s` }}>
              <i className={`bi ${feature.icon} features__icon`}></i>
              <h3 className="features__card-title">{feature.title}</h3>
              <p className="features__card-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
