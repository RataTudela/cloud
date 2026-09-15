import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiRequest } from '../config/authConfig';

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || '';

export function useApi() {
  const { instance, accounts } = useMsal();

  const fetchWithToken = async (endpoint, options = {}) => {
    const account = accounts[0] || instance.getActiveAccount();
    if (!account) throw new Error('No hay una cuenta activa');

    let accessToken = '';

    try {
      const response = await instance.acquireTokenSilent({ ...apiRequest, account });
      accessToken = response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await instance.acquireTokenPopup({ ...apiRequest, account });
        accessToken = response.accessToken;
      } else {
        throw error;
      }
    }

    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    return fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  return { fetchWithToken };
}