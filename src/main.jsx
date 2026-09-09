import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/authConfig';
import App from './App';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

async function main() {
  await msalInstance.initialize();

  try {
    const redirectResponse = await msalInstance.handleRedirectPromise();
    if (redirectResponse && redirectResponse.account) {
      msalInstance.setActiveAccount(redirectResponse.account);
    }
  } catch (error) {
    // Si hay un hash obsoleto en la URL, lo borramos automáticamente
    if (window.location.hash.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload;
      msalInstance.setActiveAccount(payload.account);
    }
  });

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
}

main().catch((err) => console.error("Error en la inicialización:", err));