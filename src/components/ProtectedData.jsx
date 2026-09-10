import { useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { useApi } from '../hooks/useApi';

export function ProtectedData() {
  const { instance } = useMsal();
  const { fetchWithToken } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Obtener el nombre o email del usuario logueado en Azure
  const activeAccount = instance.getActiveAccount();
  const userName = activeAccount?.name || activeAccount?.username || 'Benjamin Olavarria';

  const handleCrearOrden = async () => {
    setLoading(true);
    try {
      const res = await fetchWithToken('http://localhost:8081/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `ORD-${Math.floor(Math.random() * 900) + 100}`, // ID dinámico
          customer: userName, // Envía el usuario autenticado
          status: 'CREADO',
          description: 'Orden creada desde React Frontend',
        }),
      });

      const respuestaTexto = await res.text();
      setData(respuestaTexto);
    } catch (err) {
      console.error('Error al consultar la API:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthenticatedTemplate>
        <button onClick={handleCrearOrden} disabled={loading}>
          {loading ? 'Procesando...' : 'Crear Orden en Backend'}
        </button>
        {data && <pre style={{ marginTop: '10px', color: '#02d614' }}>{data}</pre>}
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <p>⚠️ Acceso denegado. Debes iniciar sesión para consultar este recurso.</p>
      </UnauthenticatedTemplate>
    </div>
  );
}