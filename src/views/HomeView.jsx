import React, { useEffect, useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const ORDERS_ENDPOINT = '/api/orders';

export function HomeView() {
    const { accounts } = useMsal();
    const account = accounts[0];
    const userName = account?.name || account?.username || 'Usuario';
    const { fetchWithToken } = useApi();

    const rawRoles = account?.idTokenClaims?.roles 
        || account?.idTokenClaims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
        || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    const isAdmin = userRoles.some(role => 
        ['admin', 'administrator', 'administrador'].includes(String(role).toLowerCase())
    );
    const isOperator = userRoles.some(role => 
        ['operator', 'operador'].includes(String(role).toLowerCase())
    );
    const isCustomer = userRoles.some(role => 
        ['customer', 'cliente'].includes(String(role).toLowerCase())
    ) || (!isAdmin && !isOperator);

    const roleLabel = isAdmin ? 'Administrador' : isOperator ? 'Operador' : 'Cliente';
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const resOrders = await fetchWithToken(ORDERS_ENDPOINT);
            if (resOrders.ok) {
                const ordersData = await resOrders.json();
                setOrders(Array.isArray(ordersData) ? ordersData : [ordersData]);
            }
        } catch (error) {
            console.error('Error al cargar datos del Dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accounts.length > 0) {
            loadDashboardData();
        }
    }, [accounts]);

    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrdersCount = orders.length;
    const activeUsersCount = new Set(orders.map(o => o.customer).filter(Boolean)).size;

    const pendingOrders = orders.filter(o => o.status === 'CREADO');
    const inProgressOrders = orders.filter(o => ['ACEPTADO', 'EN_PREPARACION'].includes(o.status));

    const myOrders = orders.filter(o => o.customer === userName || o.customer === account?.username);
    const recentMyOrders = [...myOrders].reverse().slice(0, 3);

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
                        Rol activo: <strong>{roleLabel}</strong>
                    </p>
                </section>

                <section className="role-summary-section">
                    {/* VISTA ADMIN */}
                    {isAdmin && (
                        <div className="summary-block">
                            <h3 className="section-title">Resumen Global (KPIs Admin)</h3>
                            {loading ? (
                                <p className="text-muted">Cargando métricas...</p>
                            ) : (
                                <div className="modules-grid">
                                    <article className="module-card">
                                        <span className="module-tag">Ventas Totales</span>
                                        <h4 className="module-title">${totalSales.toLocaleString('es-CL')}</h4>
                                        <p className="module-text">Monto global acumulado</p>
                                    </article>
                                    <article className="module-card">
                                        <span className="module-tag">Pedidos Totales</span>
                                        <h4 className="module-title">{totalOrdersCount}</h4>
                                        <p className="module-text">Órdenes procesadas</p>
                                    </article>
                                    <article className="module-card">
                                        <span className="module-tag">Usuarios Activos</span>
                                        <h4 className="module-title">{activeUsersCount}</h4>
                                        <p className="module-text">Clientes con actividad</p>
                                    </article>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA OPERATOR */}
                    {isOperator && (
                        <div className="summary-block">
                            <h3 className="section-title">Resumen de Actividad (Operator)</h3>
                            {loading ? (
                                <p className="text-muted">Cargando pedidos en curso...</p>
                            ) : (
                                <div className="modules-grid">
                                    <article className="module-card">
                                        <span className="module-tag">Pedidos Pendientes</span>
                                        <h4 className="module-title">{pendingOrders.length}</h4>
                                        <p className="module-text">Estado CREADO</p>
                                        <Link to="/orders" className="module-link">Ver lista <i className="fa-solid fa-arrow-right"></i></Link>
                                    </article>
                                    <article className="module-card">
                                        <span className="module-tag">Pedidos en Curso</span>
                                        <h4 className="module-title">{inProgressOrders.length}</h4>
                                        <p className="module-text">En preparación / Aceptados</p>
                                        <Link to="/orders" className="module-link">Ver lista <i className="fa-solid fa-arrow-right"></i></Link>
                                    </article>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA CUSTOMER */}
                    {isCustomer && (
                        <div className="summary-block">
                            {loading ? (
                                <p className="text-muted">Cargando tus pedidos...</p>
                            ) : (
                                <>
                                    <h4 className="section-title customer-summary-title">
                                        Últimos Pedidos y Estado Actual
                                    </h4>
                                    {recentMyOrders.length === 0 ? (
                                        <div className="module-card empty-orders-card">
                                            <p className="module-text">No registras pedidos recientes.</p>
                                            <Link to="/orders" className="module-link">Crear Pedido <i className="fa-solid fa-plus"></i></Link>
                                        </div>
                                    ) : (
                                        <div className="modules-grid">
                                            {recentMyOrders.map(order => (
                                                <article key={order.id} className="module-card">
                                                    <span className="module-tag">Orden #{order.id}</span>
                                                    <h4 className="module-title order-card-status">
                                                        Estado: {order.status}
                                                    </h4>
                                                    <p className="module-text">
                                                        Total: ${order.totalAmount?.toLocaleString('es-CL')}
                                                    </p>
                                                    <Link to="/orders" className="module-link">Detalles <i className="fa-solid fa-arrow-right"></i></Link>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* NAVEGACIÓN DIRECTA */}
                <section className="modules-section">
                    <h3 className="section-title">Navegación Directa</h3>
                    <div className="modules-grid">
                        <article className="module-card">
                            <h4 className="module-title">Órdenes y Pedidos</h4>
                            <Link to="/orders" className="module-link">Ir a Pedidos <i className="fa-solid fa-arrow-right"></i></Link>
                        </article>
                        {isAdmin && (
                            <article className="module-card">
                                <h4 className="module-title">Timeline de Auditoría</h4>
                                <Link to="/audit" className="module-link">Ir a Auditoría <i className="fa-solid fa-arrow-right"></i></Link>
                            </article>
                        )}
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