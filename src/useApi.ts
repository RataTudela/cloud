import { useMsal } from '@azure/msal-react';
import { apiRequest } from './authConfig'; // Se cambia a apiRequest

export function useApi() {
  const { instance, accounts } = useMsal();

  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const account = accounts[0] || instance.getActiveAccount();
    if (!account) throw new Error('No hay una cuenta activa');

    // Solicitar token silenciosamente usando el scope api://tallerpro360/OT.Create
    const response = await instance.acquireTokenSilent({
      ...apiRequest,
      account,
    });

    // Adjuntar token Bearer y preservar otras opciones HTTP (como POST, body, etc.)
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${response.accessToken}`,
      },
    });
  };

  return { fetchWithToken };
}