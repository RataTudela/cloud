import React from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { Link } from 'react-router-dom';

export function HomeView() {
    const { accounts } = useMsal();
    const account = accounts[0];
    const userName = account?.name || account?.username || 'Usuario';
    console.log("Claims recibidos de Azure:", account?.idTokenClaims);
    // Extraer roles desde las posibles propiedades del ID Token
    const rawRoles = account?.idTokenClaims?.roles 
        || account?.idTokenClaims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
        || [];

    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    // Validación flexible e insensible a mayúsculas
    const isAdmin = userRoles.some(role => 
        ['admin', 'administrator', 'administrador'].includes(String(role).toLowerCase())
    );
    
    const isOperator = userRoles.some(role => 
        ['operator', 'operador'].includes(String(role).toLowerCase())
    );
    
    const isCustomer = userRoles.some(role => 
        ['customer', 'cliente'].includes(String(role).toLowerCase())
    ) || (!isAdmin && !isOperator);

    // Etiqueta legible para mostrar en la interfaz
    const roleLabel = isAdmin ? 'Administrador' : isOperator ? 'Operador' : 'Cliente';

    return (
        <main className="home-container">
            <AuthenticatedTemplate>
                <div className="h1__fondo">
                    <h1>Dashboard Principal</h1>
                </div>
            
                <section className="hero-card">
                    <div className="hero-badge">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Sesión Activa</span>
                    </div>
                    <h2 className="hero-title">¡Bienvenido, {userName}!</h2>
                    <p className="hero-description">
                        Rol detectado: <strong>{roleLabel}</strong>
                    </p>
                </section>

                <section className="role-summary-section">
                    {isAdmin && (
                        <div className="summary-block">
                            <h3 className="section-title">Resumen de KPIs (Global)</h3>
                            <div className="modules-grid">
                                <article className="module-card">
                                    <span className="module-tag">Ventas</span>
                                    <h4 className="module-title">$1,250,000</h4>
                                    <p className="module-text">Total acumulado hoy</p>
                                </article>
                                <article className="module-card">
                                    <span className="module-tag">Pedidos</span>
                                    <h4 className="module-title">48</h4>
                                    <p className="module-text">Órdenes procesadas hoy</p>
                                </article>
                                <article className="module-card">
                                    <span className="module-tag">Usuarios</span>
                                    <h4 className="module-title">12</h4>
                                    <p className="module-text">Sesiones activas</p>
                                </article>
                            </div>
                        </div>
                    )}

                    {isOperator && (
                        <div className="summary-block">
                            <h3 className="section-title">Pedidos en Cuestión</h3>
                            <div className="modules-grid">
                                <article className="module-card">
                                    <span className="module-tag">Pendientes</span>
                                    <h4 className="module-title">5 Pedidos</h4>
                                    <p className="module-text">Esperando pasar a ACEPTADO</p>
                                    <Link to="/orders" className="module-link">Atender órdenes <i className="fa-solid fa-arrow-right"></i></Link>
                                </article>
                                <article className="module-card">
                                    <span className="module-tag">En Preparación</span>
                                    <h4 className="module-title">8 Pedidos</h4>
                                    <p className="module-text">Listos para despachar</p>
                                    <Link to="/orders" className="module-link">Ver cocina/despacho <i className="fa-solid fa-arrow-right"></i></Link>
                                </article>
                            </div>
                        </div>
                    )}

                    {isCustomer && (
                        <div className="summary-block">
                            <h3 className="section-title">Mis Últimos Pedidos</h3>
                            <div className="modules-grid">
                                <article className="module-card">
                                    <span className="module-tag">Pedido #1024</span>
                                    <h4 className="module-title">Estado: DESPACHADO</h4>
                                    <p className="module-text">Su pedido va en camino</p>
                                    <Link to="/orders" className="module-link">Ver detalles <i className="fa-solid fa-arrow-right"></i></Link>
                                </article>
                                <article className="module-card">
                                    <span className="module-tag">Acción</span>
                                    <h4 className="module-title">¿Deseas comprar algo más?</h4>
                                    <p className="module-text">Crea un nuevo pedido rápidamente</p>
                                    <Link to="/orders" className="module-link">Crear pedido <i className="fa-solid fa-plus"></i></Link>
                                </article>
                            </div>
                        </div>
                    )}
                </section>

                {/* Acceso Rápido a Módulos */}
                <section className="modules-section">
                    <h3 className="section-title">Navegación Directa</h3>
                    <div className="modules-grid">
                        <article className="module-card">
                            <h4 className="module-title">Órdenes y Pedidos</h4>
                            <Link to="/orders" className="module-link">Ir a Pedidos <i className="fa-solid fa-arrow-right"></i></Link>
                        </article>
                        <article className="module-card">
                            <h4 className="module-title">Timeline de Auditoría</h4>
                            <Link to="/audit" className="module-link">Ir a Auditoría <i className="fa-solid fa-arrow-right"></i></Link>
                        </article>
                    </div>
                </section>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <div className="h1__fondo">
                    <h1>Pedidos360</h1>
                </div>
                <section className="hero-card hero-card--unauthenticated">
                    <div className="unauth-icon">
                        <i className="fa-solid fa-lock"></i>
                    </div>
                    <h2 className="hero-title">Acceso Restringido</h2>
                    <p className="hero-description">
                        Debes iniciar sesión con tu cuenta corporativa en Azure AD para consultar la plataforma.
                    </p>
                </section>
            </UnauthenticatedTemplate>
        </main>
    );
}