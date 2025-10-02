import React from 'react';

const Header = () => {
  return (
    <header className="brand-header">
      <div className="brand-container">
        <div className="brand-left">
          <img
            src={process.env.PUBLIC_URL + '/logo_pronta.png'}
            alt="Pronta Serviços Contábeis"
            className="brand-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="brand-title">
            <div className="brand-name">Planejamento Tributário - Simples Nacional - Anexo III V e Presumido</div>
            <div className="brand-sub">Pronta Serviços Contábeis</div>
          </div>
        </div>
        <div className="brand-right">
          <a className="brand-link" href="#" onClick={(e)=>e.preventDefault()}>Contato</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
