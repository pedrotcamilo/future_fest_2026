import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './scss/Differentials.scss';

const differentials = [
  {
    icon: 'bi-stars',
    title: 'Simples e Acessível',
    description: 'Interface amigável, em português, pensada para o dia a dia da farmácia.'
  },
  {
    icon: 'bi-bullseye',
    title: 'Feito para a Manipulação',
    description: 'Lote, validade, fórmula e produção sob demanda — não um sistema de estoque genérico.'
  },
  {
    icon: 'bi-cpu',
    title: 'Inteligência Prática',
    description: 'Sugestões de reposição e previsões de consumo que ajudam a comprar certo e evitar desperdício.'
  },
  {
    icon: 'bi-rocket',
    title: 'Fácil de Implantar',
    description: 'Pode rodar na própria infraestrutura da farmácia, sem dependência de servidores externos.'
  }
];

function Differentials() {
  const sectionRef = useScrollReveal();

  return (
    <section className="differentials" id="diferenciais" ref={sectionRef}>
      <div className="differentials__container">
        <h2 className="differentials__title reveal">
          Por que escolher o <span>AxionPhare</span>?
        </h2>
        <p className="differentials__subtitle reveal">
          Para farmacêuticos e donos de farmácias de manipulação de pequeno e médio porte que querem sair do controle manual.
        </p>
        <div className="differentials__grid">
          {differentials.map((diff, index) => (
            <div key={index} className="differentials__card reveal" style={{ transitionDelay: `${index * 0.1}s` }}>
              <i className={`bi ${diff.icon} differentials__icon`}></i>
              <h3 className="differentials__card-title">{diff.title}</h3>
              <p className="differentials__card-description">{diff.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Differentials;
