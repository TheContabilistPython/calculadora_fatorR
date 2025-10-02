import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Senha pode ser configurada via variável de ambiente
    const correctPassword = process.env.REACT_APP_ACCESS_PASSWORD || 'pronta2025';
    
    if (password === correctPassword) {
      setError('');
      // Salva no localStorage para manter a sessão
      localStorage.setItem('isAuthenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img 
            src="/logo_pronta_.png" 
            alt="Pronta Serviços Contábeis" 
            className="login-logo"
          />
          <h2>Acesso Restrito</h2>
          <p>Digite a senha para acessar o sistema</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="login-input"
              autoFocus
            />
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
        
        <div className="login-footer">
          <small>Pronta Serviços Contábeis © 2025</small>
        </div>
      </div>
    </div>
  );
};

export default Login;
