import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';

export function Header() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);

  const account = accounts[0];
  const userName = account?.name || account?.username;

  // Detección de roles desde MSAL
  console.log('Claims del Token:', account?.idTokenClaims);
  console.log('Roles encontrados:', account?.idTokenClaims?.roles);

  const rawRoles =
    account?.idTokenClaims?.roles ||
    account?.idTokenClaims?.[
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ] ||
    [];

  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

  const isAdmin = userRoles.some(role =>
    ['admin', 'administrator', 'administrador'].includes(
      String(role).toLowerCase()
    )
  );

  const isOperator = userRoles.some(role =>
    ['operator', 'operador'].includes(
      String(role).toLowerCase()
    )
  );

  const isCustomer =
    userRoles.some(role =>
      ['customer', 'cliente'].includes(
        String(role).toLowerCase()
      )
    ) || (!isAdmin && !isOperator);

  const roleLabel = isAdmin
    ? 'Administrador'
    : isOperator
      ? 'Operador'
      : 'Cliente';

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
          aria-label="Abrir menú"
        >
          <i
            className={`fa-solid ${
              menuOpen ? 'fa-xmark' : 'fa-bars'
            }`}
          ></i>
        </button>

        <div
          className={`nav__content ${
            menuOpen ? 'is-active' : ''
          }`}
        >
          <ul className="nav__list">

            {/* Home */}
            <li className="list__items">
              <Link
                to="/dashboard"
                className="item__link"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
            </li>

            {/* Pedidos */}
            <li className="list__items">
              <Link
                to="/orders"
                className="item__link"
                onClick={() => setMenuOpen(false)}
              >
                Pedidos
              </Link>
            </li>

            {/* Catálogo - Solo Admin y Operador */}
            {(isAdmin || isOperator) && (
              <li className="list__items">
                <Link
                  to="/catalog"
                  className="item__link"
                  onClick={() => setMenuOpen(false)}
                >
                  Catálogo
                </Link>
              </li>
            )}



            {/* Auditoría - Solo Administrador */}
            {isAdmin && (
              <li className="list__items">
                <Link
                  to="/audit"
                  className="item__link"
                  onClick={() => setMenuOpen(false)}
                >
                  Auditoría
                </Link>
              </li>
            )}

            {/* Reportes - Solo Administrador */}
            {isAdmin && (
              <li className="list__items">
                <Link
                  to="/report"
                  className="item__link"
                  onClick={() => setMenuOpen(false)}
                >
                  Reportes
                </Link>
              </li>
            )}
          </ul>

          {/* Sección de Autenticación */}
          <div className="nav__auth">
            {isAuthenticated ? (
              <div className="auth__user">

                <div
                  className="user__info"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                  }}
                >
                  <span
                    className="user__name"
                    title={userName}
                  >
                    {userName}
                  </span>

                  <span
                    className="user__role badge bg-secondary"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {roleLabel}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn-logout"
                  title="Cerrar sesión"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>{' '}
                  Salir
                </button>

              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="btn-login"
              >
                <i className="fa-solid fa-right-to-bracket"></i>{' '}
                Iniciar Sesión
              </button>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
}