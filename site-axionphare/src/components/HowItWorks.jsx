import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './scss/HowItWorks.scss';

const steps = [
  {
    number: '01',
    title: 'Cadastros',
    description: 'A farmácia cadastra fornecedores, matérias-primas e fórmulas.'
  },
  {
    number: '02',
    title: 'Compras e Recebimento',
    description: 'Compras são lançadas e, ao receber, o sistema cria os lotes e atualiza o estoque automaticamente.'
  },
  {
    number: '03',
    title: 'Produção',
    description: 'Quando chega um pedido do cliente, abre-se uma ordem de produção; ao produzir, o consumo dos insumos é baixado do estoque na hora.'
  },
  {
    number: '04',
    title: 'Análise e Alertas',
    description: 'O sistema analisa o histórico, sugere compras e emite alertas de falta e vencimento.'
  },
  {
    number: '05',
    title: 'Gestão',
    description: 'O gestor acompanha tudo em um painel com indicadores e relatórios.'
  }
];

function HowItWorks() {
  const sectionRef = useScrollReveal();

  return (
    <section className="how-it-works" id="como-funciona" ref={sectionRef}>
      <div className="how-it-works__container">
        <h2 className="how-it-works__title reveal">
          Como funciona na <span>prática</span>
        </h2>
        <div className="how-it-works__timeline">
          {steps.map((step, index) => (
            <div key={index} className="how-it-works__step reveal" style={{ transitionDelay: `${index * 0.12}s` }}>
              <div className="how-it-works__step-number">{step.number}</div>
              <div className="how-it-works__step-content">
                <h3 className="how-it-works__step-title">{step.title}</h3>
                <p className="how-it-works__step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
