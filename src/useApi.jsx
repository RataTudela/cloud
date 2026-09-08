import { useMsal } from '@azure/msal-react';
import { apiRequest } from './authConfig';

export function useApi() {
  const { instance, accounts } = useMsal();

  const fetchWithToken = async (url, options = {}) => {
    const account = accounts[0] || instance.getActiveAccount();
    if (!account) throw new Error('No hay una cuenta activa');

    const response = await instance.acquireTokenSilent({ ...apiRequest, account });

    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${response.accessToken}` },
    });
  };

  return { fetchWithToken };
}