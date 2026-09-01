import { useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useApi } from './useApi';

export function ProtectedData() {
  const { fetchWithToken } = useApi();
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCrearOrden = async () => {
    setLoading(true);
    try {
      // Petición POST al endpoint protegido en Spring Boot
      const res = await fetchWithToken('http://localhost:8080/api/ordenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'OT-101',
          descripcion: 'Cambio de aceite y filtros',
          estado: 'EN_PROCESO',
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