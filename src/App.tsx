import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest } from './authConfig';
import { SuccessView } from './vistaExito';
import { ErrorView } from './errorView';
import './App.css';
import "@fontsource/roboto-mono"; 
import "@fontsource/roboto-mono/700.css"; 

export default function App() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = accounts[0];

  const [authError, setAuthError] = useState<string | null>(null);

  const isLoading = inProgress !== InteractionStatus.None;

  // Escuchar errores directamente de las promesas del redirect
  const handleLogin = () => {
    setAuthError(null);
    if (!isLoading) {
      instance.loginRedirect(loginRequest).catch((error: any) => {
        console.error("Error de autenticación:", error);
        setAuthError(error?.errorMessage || "Se canceló o falló la autenticación con Microsoft.");
      });
    }
  };

  const handleLogout = () => {
    setAuthError(null);
    if (!isLoading) {
      instance.logoutRedirect({ postLogoutRedirectUri: '/' }).catch((e) => console.error(e));
    }
  };

  return (
    <>
      <div className='fondo'></div>
      <div className='overlay--fondo'></div>

      <div className='algo'>
          
          {/* VISTA 1: ÉXITO */}
          {isAuthenticated ? (
            <SuccessView 
              currentUser={currentUser} 
              onLogout={handleLogout} 
            />
          
          /* VISTA 2: ERROR */
          ) : authError ? (
            <ErrorView 
              errorMessage={authError} 
              onRetry={handleLogin} 
            />

          /* VISTA INICIAL */
          ) : (
            <div className='wrapper'>
              <div className='h1__fondo'>
                <h1>Portal de Autenticación</h1>
              </div>
              <div className='forms'>
                <p>Debes iniciar sesión con tu cuenta institucional para continuar.</p>
                
                {isLoading ? (
                  <div className='circle'>
                    <div className='cirlce__center'></div>
                  </div>
                ) : (
                  <button onClick={handleLogin}>
                    Iniciar Sesión
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
    </>
  );
}