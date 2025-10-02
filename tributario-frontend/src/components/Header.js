import React from 'react';

const Header = ({ onLogout }) => {
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
          {onLogout && (
            <button 
              className="brand-link logout-button" 
              onClick={onLogout}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'inherit',
                font: 'inherit',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
