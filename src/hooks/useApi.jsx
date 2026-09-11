import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiRequest } from '../config/authConfig';

export function useApi() {
  const { instance, accounts } = useMsal();

  const fetchWithToken = async (url, options = {}) => {
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

    return fetch(url, {
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