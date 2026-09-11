import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';

export function Header() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = accounts[0]?.name || accounts[0]?.username;

  const handleLogin = () => {
    instance.loginRedirect().catch((e) => console.error(e));
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/',
    });
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="main-header">
      <nav className="header__nav">
        <div className="logo">
          <div className="logo__into">
            <i className="fa-solid fa-shopping-cart carrito-rojo"></i>
          </div>
        </div>
        <button 
          className="nav__toggle" 
          onClick={toggleMenu} 
          aria-label="Abrir menú">
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        <div className={`nav__content ${menuOpen ? 'is-active' : ''}`}>
          <ul className="nav__list">
            <li className="list__items">
              <Link to="/dashboard" className="item__link" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li className="list__items">
              <Link to="/orders" className="item__link" onClick={() => setMenuOpen(false)}>
                Pedidos
              </Link>
            </li>
            <li className="list__items">
              <Link to="/audit" className="item__link" onClick={() => setMenuOpen(false)}>
                Auditoría
              </Link>
            </li>
          </ul>

          {/* Sección de Autenticación */}
          <div className="nav__auth">
            {isAuthenticated ? (
              <div className="auth__user">
                <span className="user__name" title={userName}>
                  {userName}
                </span>
                <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
                  <i className="fa-solid fa-right-from-bracket"></i> Salir
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="btn-login">
                <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}