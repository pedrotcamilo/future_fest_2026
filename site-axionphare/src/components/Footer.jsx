import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './scss/Footer.scss';

import axionphareWhite from '../assets/axionphare-white.png';

function Footer() {
  const footerRef = useScrollReveal();

  return (
    <footer className="footer" ref={footerRef}>
      <div className="footer__container">
        <div className="footer__brand reveal">
          <img className="footer__logo" src={ axionphareWhite } alt="" />
          <p className="footer__tagline">Gestão simples e inteligente para farmácias de manipulação.</p>
        </div>
        <div className="footer__links reveal">
          <a href="#funcionalidades" className="footer__link">Funcionalidades</a>
          <a href="#como-funciona" className="footer__link">Como Funciona</a>
          <a href="#diferenciais" className="footer__link">Diferenciais</a>
          <a href="#proximos-passos" className="footer__link">Próximos Passos</a>
        </div>
      </div>
      <div className="footer__bottom reveal">
        <p>&copy; 2026 AxionPhare, Pedro Tiritan. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
