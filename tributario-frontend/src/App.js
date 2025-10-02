import { useState, useEffect } from 'react';
import './App.css';
import CompareForm from './CompareForm';
import Header from './components/Header';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verifica se já está autenticado ao carregar
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  // Se não estiver autenticado, mostra tela de login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Se estiver autenticado, mostra o app
  return (
    <div className="app-root">
      <Header onLogout={handleLogout} />
      <CompareForm />
    </div>
  );
}

export default App;
