import React, { useState, useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useApi } from '../hooks/useApi';

export function AuditView() {
  const { fetchWithToken } = useApi();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    usuario: '',
    fechaInicio: '',
    fechaFin: '',
    evento: 'todo'
  });

  const fetchAuditLogs = async (customFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (customFilters.usuario) params.append('actor', customFilters.usuario);
      let url = '/api/audit';
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetchWithToken(url);

      if (!res.ok) {
        throw new Error(`Error en el servidor: ${res.status} ${res.statusText}`);
      }

      let data = await res.json();

      if (customFilters.evento !== 'todo') {
        data = data.filter((log) =>
          log.eventType?.toLowerCase().includes(customFilters.evento.toLowerCase())
        );
      }

      if (customFilters.fechaInicio) {
        data = data.filter(
          (log) => new Date(log.timestamp) >= new Date(customFilters.fechaInicio)
        );
      }

      if (customFilters.fechaFin) {
        const fechaHasta = new Date(customFilters.fechaFin);
        fechaHasta.setHours(23, 59, 59, 999);
        data = data.filter((log) => new Date(log.timestamp) <= fechaHasta);
      }

      setLogs(data);
    } catch (err) {
      console.error('Error al obtener registros de auditoría:', err);
      setError(err.message || 'Ocurrió un error al cargar la auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.id || e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs(filters);
  };

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <AuthenticatedTemplate>
        <h1>Timeline de Auditoría</h1>

        {/* Formulario de Filtros */}
        <div className="forms__box">
          <form onSubmit={handleSubmit}>
            <div className="inputs__row">
              <div className="filter__group">
                <label htmlFor="usuario">Usuario / Actor:</label>
                <input
                  type="text"
                  id="usuario"
                  placeholder="Ej: Benjamin Olavarria"
                  value={filters.usuario}
                  onChange={handleChange}
                />
              </div>

              <div className="filter__group">
                <label>Rango de Fechas:</label>
                <div className="date__range">
                  <input
                    type="date"
                    name="fechaInicio"
                    value={filters.fechaInicio}
                    onChange={handleChange}
                  />
                  <span>a</span>
                  <input
                    type="date"
                    name="fechaFin"
                    value={filters.fechaFin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="filter__group">
                <label htmlFor="evento">Tipo de Evento:</label>
                <select id="evento" value={filters.evento} onChange={handleChange}>
                  <option value="todo">Todos Los Eventos</option>
                  <option value="ordenCreate">Orden Creada</option>
                  <option value="ordenAccepted">Orden Aceptada</option>
                  <option value="ordenPrepared">Orden Preparada</option>
                  <option value="ordenDispatched">Orden Enviada</option>
                  <option value="ordenDelivery">Orden Entregada</option>
                  <option value="ordenDelete">Orden Eliminada / Cancelada</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn__filter">
              Filtrar
            </button>
          </form>
        </div>

        {error && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px'
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Timeline de Eventos */}
        <section style={{ marginTop: '2rem' }}>
          {loading ? (
            <p>Cargando eventos de auditoría...</p>
          ) : logs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                color: '#64748b'
              }}
            >
              No se encontraron registros de auditoría para los filtros aplicados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    borderLeft: '4px solid #2563eb',
                    padding: '1rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '0 8px 8px 0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    borderTop: '1px solid #e2e8f0',
                    borderRight: '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b' }}>
                      ⚡ {log.eventType} {log.orderId ? `- Pedido: #${log.orderId}` : ''}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#475569' }}>
                    <strong>Realizado por:</strong> {log.actor || 'Sistema'}
                  </p>

                  {log.details && (
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary
                        style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#2563eb' }}
                      >
                        Ver payload del evento (JSON)
                      </summary>
                      <pre
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#38bdf8',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          overflowX: 'auto',
                          marginTop: '0.5rem'
                        }}
                      >
                        {JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#dc2626' }}>
          ⚠️ Acceso denegado. Debes iniciar sesión con Azure AD para consultar la auditoría.
        </p>
      </UnauthenticatedTemplate>
    </main>
  );
}