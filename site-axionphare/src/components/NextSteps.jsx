import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './scss/NextSteps.scss';

const nextSteps = [
  'Previsão de demanda com machine learning',
  'Notificações por e-mail e WhatsApp',
  'Relatórios exportáveis (PDF/Excel)',
  'Emissão de NF-e',
  'Versão multi-farmácia (cloud) com assinatura mensal'
];

function NextSteps() {
  const sectionRef = useScrollReveal();

  return (
    <section className="next-steps" id="proximos-passos" ref={sectionRef}>
      <div className="next-steps__container">
        <h2 className="next-steps__title reveal">
          Próximos <span>passos</span>
        </h2>
        <p className="next-steps__subtitle reveal">
          O sistema está funcional e modularizado, com todos os módulos principais implementados. Uma base sólida, pronta para evoluir:
        </p>
        <ul className="next-steps__list">
          {nextSteps.map((step, index) => (
            <li key={index} className="next-steps__item reveal" style={{ transitionDelay: `${index * 0.1}s` }}>
              <i className="bi bi-check-circle-fill next-steps__check"></i>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default NextSteps;
