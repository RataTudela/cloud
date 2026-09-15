import React, { useState, useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import { useApi } from '../hooks/useApi';

export function AuditView() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const { fetchWithToken } = useApi();

  // Detección de roles MSAL
  const rawRoles = account?.idTokenClaims?.roles 
    || account?.idTokenClaims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
    || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

  const isAdminOrAuditor = userRoles.some(role => 
    ['admin', 'administrator', 'administrador', 'auditor'].includes(String(role).toLowerCase())
  );

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    usuario: '',
    fechaInicio: '',
    fechaFin: '',
    evento: 'todo'
  });

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
    }
  };

  const fetchAuditLogs = async (customFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithToken('/api/audit');
      if (!res.ok) {
        throw new Error(`Error en el servidor: ${res.status} ${res.statusText}`);
      }
      let data = await res.json();

      if (customFilters.usuario.trim()) {
        const termino = customFilters.usuario.trim().toLowerCase();
        data = data.filter((log) =>
          log.actor?.toLowerCase().includes(termino)
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

      if (customFilters.evento !== 'todo') {
        data = data.filter((log) => {
          let status = '';
          try {
            const detailsObj = JSON.parse(log.details || '{}');
            status = detailsObj.status || '';
          } catch (e) {
            status = '';
          }
          const targetEvent = customFilters.evento.toLowerCase();
          return (
            status.toLowerCase() === targetEvent ||
            log.eventType?.toLowerCase().includes(targetEvent)
          );
        });
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
    if (accounts.length > 0 && isAdminOrAuditor) {
      fetchAuditLogs();
    }
  }, [accounts, isAdminOrAuditor]);

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
    <main>
      <AuthenticatedTemplate>
        {!isAdminOrAuditor ? (
          <div className="forms__box alert-denied" style={{ marginTop: '20px' }}>
            <p className="text-danger mb-0">
              <i className="fa-solid fa-triangle-exclamation"></i> Acceso denegado: Se requieren permisos de <strong>Administrador</strong> o <strong>Auditor</strong> para consultar la auditoría.
            </p>
          </div>
        ) : (
          <>
            <div className="h1__fondo">
              <h1>Timeline de Auditoría</h1>
            </div>
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
                    <label htmlFor="evento">Estado del Pedido:</label>
                    <select id="evento" value={filters.evento} onChange={handleChange}>
                      <option value="todo">Todos los Eventos</option>
                      <option value="CREADO">CREADO</option>
                      <option value="ACEPTADO">ACEPTADO</option>
                      <option value="EN_PREPARACION">EN_PREPARACION</option>
                      <option value="DESPACHADO">DESPACHADO</option>
                      <option value="ENTREGADO">ENTREGADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn__filter">
                  Filtrar
                </button>
              </form>
            </div>
            {error && (
              <div className="alert-error">
                <i className="fa-solid fa-triangle-exclamation"></i> {error}
              </div>
            )}

            <section className="audit-container">
              {loading ? (
                <p className="audit-empty">Cargando eventos de auditoría...</p>
              ) : logs.length === 0 ? (
                <div className="forms__box audit-empty">
                  No se encontraron registros de auditoría para los filtros aplicados.
                </div>
              ) : (
                <div className="audit-list">
                  {logs.map((log) => {
                    let parsedDetails = {};
                    try {
                      parsedDetails = JSON.parse(log.details || '{}');
                    } catch (e) {
                      parsedDetails = {};
                    }
                    return (
                      <div key={log.id} className="audit-card">
                        <div className="audit-card__header">
                          <div className="audit-card__title-group">
                            <i className="fa-solid fa-bolt audit-card__icon"></i>
                            <span className="audit-card__title">
                              {log.orderId ? `Pedido #${log.orderId}` : 'Evento de Sistema'}
                            </span>
                            {parsedDetails.status && (
                              <span className="audit-card__badge">
                                {parsedDetails.status}
                              </span>
                            )}
                          </div>
                          <span className="audit-card__date">
                            <i className="fa-regular fa-clock"></i>{' '}
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="audit-card__body">
                          <p className="audit-card__text">
                            <strong>Realizado por:</strong> {log.actor || 'Sistema'}
                          </p>
                          {parsedDetails.description && (
                            <p className="audit-card__text--secondary">
                              <strong>Descripción:</strong> {parsedDetails.description}
                            </p>
                          )}
                          {parsedDetails.totalAmount && (
                            <p className="audit-card__text">
                              <strong>Monto Total:</strong> ${parsedDetails.totalAmount.toLocaleString('es-CL')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="forms__box alert-denied" style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>
            <i className="fa-solid fa-lock"></i> Acceso denegado. Debes iniciar sesión con Azure AD para consultar la auditoría.
          </p>
          <button className="btn__filter" onClick={handleLogin}>
            Iniciar Sesión
          </button>
        </div>
      </UnauthenticatedTemplate>
    </main>
  );
}