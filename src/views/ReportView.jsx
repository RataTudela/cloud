import React, { useEffect, useState } from 'react';
import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
    useMsal
} from '@azure/msal-react';

import { loginRequest } from '../config/authConfig';
import { useApi } from '../hooks/useApi';

const API_BASE =
    import.meta.env.VITE_REPORT_API_BASE_URL ||
    'http://localhost:8088';

const REPORT_API_URL = `${API_BASE}/api/report`;

export const ReportsPage = () => {
    const { instance, accounts } = useMsal();
    const { fetchWithToken } = useApi();

    const [salesByHour, setSalesByHour] = useState([]);
    const [leadTime, setLeadTime] = useState([]);
    const [activeStatus, setActiveStatus] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const account = accounts[0] || instance.getActiveAccount();

    const rawRoles =
        account?.idTokenClaims?.roles ||
        account?.idTokenClaims?.[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] ||
        [];

    const userRoles = Array.isArray(rawRoles)
        ? rawRoles
        : [rawRoles];

    const isAdmin = userRoles.some(role =>
        ['admin', 'administrator', 'administrador'].includes(
            String(role).toLowerCase()
        )
    );

    const isOperator = userRoles.some(role =>
        ['operator', 'operador'].includes(
            String(role).toLowerCase()
        )
    );

    const canViewReports = isAdmin || isOperator;

    const handleLogin = async () => {
        try {
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setErrorMsg('No fue posible iniciar sesión.');
        }
    };

    const fetchReport = async endpoint => {
        const response = await fetchWithToken(
            `${REPORT_API_URL}${endpoint}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    };

    const fetchReports = async () => {
        setLoading(true);
        setErrorMsg('');

        try {
            const results = await Promise.allSettled([
                fetchReport('/sales-by-hour'),
                fetchReport('/lead-time'),
                fetchReport('/active-status'),
                fetchReport('/top-products')
            ]);

            const errors = [];

            if (results[0].status === 'fulfilled') {
                setSalesByHour(
                    Array.isArray(results[0].value)
                        ? results[0].value
                        : []
                );
            } else {
                errors.push('Ventas por hora');
                console.error(
                    'Error en ventas por hora:',
                    results[0].reason
                );
            }

            if (results[1].status === 'fulfilled') {
                setLeadTime(
                    Array.isArray(results[1].value)
                        ? results[1].value
                        : []
                );
            } else {
                errors.push('Tiempo de entrega');
                console.error(
                    'Error en tiempo de entrega:',
                    results[1].reason
                );
            }

            if (results[2].status === 'fulfilled') {
                setActiveStatus(
                    Array.isArray(results[2].value)
                        ? results[2].value
                        : []
                );
            } else {
                errors.push('Estado de pedidos');
                console.error(
                    'Error en estado de pedidos:',
                    results[2].reason
                );
            }

            if (results[3].status === 'fulfilled') {
                setTopProducts(
                    Array.isArray(results[3].value)
                        ? results[3].value
                        : []
                );
            } else {
                errors.push('Productos más vendidos');
                console.error(
                    'Error en productos más vendidos:',
                    results[3].reason
                );
            }

            if (errors.length > 0) {
                setErrorMsg(
                    `No fue posible cargar: ${errors.join(
                        ', '
                    )}. Verifica que el microservicio de reportes esté disponible.`
                );
            }
        } catch (error) {
            console.error('Error general de reportes:', error);

            setErrorMsg(
                'No fue posible cargar los reportes. Verifica que el microservicio de reportes esté disponible.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accounts.length > 0 && canViewReports) {
            fetchReports();
        }
    }, [accounts, canViewReports]);

    const formatNumber = value => {
        const number = Number(value || 0);

        return number.toLocaleString('es-CL');
    };

    const formatCurrency = value => {
        const number = Number(value || 0);

        return `$${number.toLocaleString('es-CL')}`;
    };

    const getStatusClass = status => {
        switch (String(status).toUpperCase()) {
            case 'CREADO':
                return 'bg-secondary';

            case 'ACEPTADO':
                return 'bg-info text-dark';

            case 'EN_PREPARACION':
                return 'bg-warning text-dark';

            case 'DESPACHADO':
                return 'bg-primary';

            case 'ENTREGADO':
                return 'bg-success';

            case 'CANCELADO':
                return 'bg-danger';

            default:
                return 'bg-secondary';
        }
    };

    const getLeadTimeMinutes = item =>
        Number(
            item?.minutes ??
                item?.minute ??
                item?.leadTime ??
                item?.leadTimeMinutes ??
                0
        );

    const averageLeadTime =
        leadTime.length > 0
            ? leadTime.reduce(
                  (total, item) =>
                      total + getLeadTimeMinutes(item),
                  0
              ) / leadTime.length
            : 0;

    const minimumLeadTime =
        leadTime.length > 0
            ? Math.min(
                  ...leadTime.map(item =>
                      getLeadTimeMinutes(item)
                  )
              )
            : 0;

    const maximumLeadTime =
        leadTime.length > 0
            ? Math.max(
                  ...leadTime.map(item =>
                      getLeadTimeMinutes(item)
                  )
              )
            : 0;

    const totalOrders = activeStatus.reduce(
        (total, item) =>
            total +
            Number(
                item?.count ??
                    item?.quantity ??
                    item?.total ??
                    item?.cantidad ??
                    0
            ),
        0
    );

    return (
        <main>
            <UnauthenticatedTemplate>
                <div className="h1__fondo">
                    <h1>Autenticación Requerida</h1>
                </div>

                <div className="forms__box text-center margin__flex">
                    <p className="text-muted mb-3">
                        Debes iniciar sesión para acceder a los
                        reportes.
                    </p>

                    <button
                        type="button"
                        className="btn__filter"
                        onClick={handleLogin}
                    >
                        Iniciar Sesión con Microsoft
                    </button>
                </div>
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                {!canViewReports ? (
                    <>
                        <div className="h1__fondo">
                            <h1>Acceso Denegado</h1>
                        </div>

                        <div className="forms__box alert-denied">
                            <p>
                                No tienes permisos para acceder a
                                los reportes.
                            </p>

                            <span className="text-muted">
                                Esta sección está disponible para
                                usuarios Administrador y Operador.
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="h1__fondo">
                            <h1>Reportes y Analítica</h1>
                        </div>

                        {errorMsg && (
                            <div className="alert-error w-100">
                                {errorMsg}
                            </div>
                        )}

                        <div className="forms__box mb-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h3 className="mb-1">
                                        Panel de Reportes
                                    </h3>

                                    <p className="text-muted mb-0">
                                        Resumen de ventas, pedidos,
                                        tiempos de entrega y
                                        productos más vendidos.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="btn__filter"
                                    onClick={fetchReports}
                                    disabled={loading}
                                    style={{
                                        width: 'auto',
                                        maxWidth: 'none',
                                        margin: '0'
                                    }}
                                >
                                    {loading
                                        ? 'Actualizando...'
                                        : 'Recargar Reportes'}
                                </button>
                            </div>
                        </div>

                        <div className="forms__box mb-4">
                            <h3 className="mb-3">
                                Resumen General
                            </h3>

                            <div className="cart-grid">
                                <div className="cart-card">
                                    <p className="title">
                                        Pedidos
                                    </p>

                                    <p className="mb-0">
                                        {formatNumber(totalOrders)}
                                    </p>
                                </div>

                                <div className="cart-card">
                                    <p className="title">
                                        Promedio de Entrega
                                    </p>

                                    <p className="mb-0">
                                        {formatNumber(
                                            Math.round(
                                                averageLeadTime
                                            )
                                        )}{' '}
                                        min
                                    </p>
                                </div>

                                <div className="cart-card">
                                    <p className="title">
                                        Productos
                                    </p>

                                    <p className="mb-0">
                                        {formatNumber(
                                            topProducts.length
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="forms__box mb-4">
                            <h3 className="mb-3">
                                Estado de los Pedidos
                            </h3>

                            <p className="text-muted mb-3">
                                Cantidad de pedidos registrados en
                                cada estado.
                            </p>

                            {activeStatus.length === 0 ? (
                                <p className="text-muted mb-0">
                                    {loading
                                        ? 'Cargando información...'
                                        : 'No hay información disponible.'}
                                </p>
                            ) : (
                                <div className="cart-grid">
                                    {activeStatus.map(
                                        (item, index) => {
                                            const status =
                                                item?.status ??
                                                item?.estado ??
                                                item?.orderStatus ??
                                                'SIN ESTADO';

                                            const count =
                                                item?.count ??
                                                item?.quantity ??
                                                item?.total ??
                                                item?.cantidad ??
                                                0;

                                            return (
                                                <div
                                                    key={index}
                                                    className="cart-card"
                                                >
                                                    <p className="title">
                                                        {String(
                                                            status
                                                        ).replace(
                                                            /_/g,
                                                            ' '
                                                        )}
                                                    </p>

                                                    <p className="mb-0">
                                                        {formatNumber(
                                                            count
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="table-glass-container mb-4">
                            <div className="mb-3">
                                <h3 className="mb-1">
                                    Ventas por Hora
                                </h3>

                                <p className="text-muted mb-0">
                                    Ventas y cantidad de pedidos
                                    agrupados según la hora de
                                    entrega.
                                </p>
                            </div>

                            <table className="custom-glass-table">
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Pedidos</th>
                                        <th>Total Ventas</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {salesByHour.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="text-center py-4 text-muted"
                                            >
                                                {loading
                                                    ? 'Cargando datos...'
                                                    : 'No hay datos de ventas disponibles.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        salesByHour.map(
                                            (item, index) => {
                                                const hour =
                                                    item?.hour ??
                                                    item?.hora ??
                                                    item?.salesHour ??
                                                    '-';

                                                const orders =
                                                    item?.totalOrders ??
                                                    item?.orders ??
                                                    item?.orderCount ??
                                                    item?.count ??
                                                    item?.cantidad ??
                                                    0;

                                                const sales =
                                                    item?.totalSales ??
                                                    item?.sales ??
                                                    item?.total ??
                                                    item?.totalAmount ??
                                                    0;

                                                return (
                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <td data-label="Hora">
                                                            {hour}
                                                        </td>

                                                        <td data-label="Pedidos">
                                                            {formatNumber(
                                                                orders
                                                            )}
                                                        </td>

                                                        <td
                                                            data-label="Total Ventas"
                                                            className="text-success fw-bold"
                                                        >
                                                            {formatCurrency(
                                                                sales
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="forms__box mb-4">
                            <h3 className="mb-3">
                                Tiempo de Entrega
                            </h3>

                            <p className="text-muted mb-3">
                                Análisis de los tiempos registrados
                                para las órdenes entregadas.
                            </p>

                            {leadTime.length === 0 ? (
                                <p className="text-muted mb-0">
                                    {loading
                                        ? 'Calculando tiempos de entrega...'
                                        : 'No hay información disponible.'}
                                </p>
                            ) : (
                                <>
                                    <div className="cart-grid">
                                        <div className="cart-card">
                                            <p className="title">
                                                Promedio
                                            </p>

                                            <p className="mb-0">
                                                {formatNumber(
                                                    Math.round(
                                                        averageLeadTime
                                                    )
                                                )}{' '}
                                                minutos
                                            </p>
                                        </div>

                                        <div className="cart-card">
                                            <p className="title">
                                                Mínimo
                                            </p>

                                            <p className="mb-0">
                                                {formatNumber(
                                                    minimumLeadTime
                                                )}{' '}
                                                minutos
                                            </p>
                                        </div>

                                        <div className="cart-card">
                                            <p className="title">
                                                Máximo
                                            </p>

                                            <p className="mb-0">
                                                {formatNumber(
                                                    maximumLeadTime
                                                )}{' '}
                                                minutos
                                            </p>
                                        </div>

                                        <div className="cart-card">
                                            <p className="title">
                                                Analizados
                                            </p>

                                            <p className="mb-0">
                                                {formatNumber(
                                                    leadTime.length
                                                )}{' '}
                                                pedidos
                                            </p>
                                        </div>
                                    </div>

                                    <div className="table-glass-container mt-4">
                                        <table className="custom-glass-table">
                                            <thead>
                                                <tr>
                                                    <th>Pedido</th>
                                                    <th>
                                                        Tiempo de
                                                        Entrega
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {leadTime.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => {
                                                        const orderId =
                                                            item?.orderId ??
                                                            item?.idOrder ??
                                                            item?.idPedido ??
                                                            item?.pedidoId ??
                                                            '-';

                                                        const minutes =
                                                            getLeadTimeMinutes(
                                                                item
                                                            );

                                                        return (
                                                            <tr
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                <td data-label="Pedido">
                                                                    #{orderId}
                                                                </td>

                                                                <td
                                                                    data-label="Tiempo de Entrega"
                                                                    className="fw-bold"
                                                                >
                                                                    {formatNumber(
                                                                        minutes
                                                                    )}{' '}
                                                                    minutos
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="table-glass-container mb-4">
                            <div className="mb-3">
                                <h3 className="mb-1">
                                    Productos Más Vendidos
                                </h3>

                                <p className="text-muted mb-0">
                                    Ranking de productos según la
                                    cantidad vendida y el total
                                    generado.
                                </p>
                            </div>

                            <table className="custom-glass-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Producto</th>
                                        <th>Cantidad Vendida</th>
                                        <th>Total Ventas</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {topProducts.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="text-center py-4 text-muted"
                                            >
                                                {loading
                                                    ? 'Cargando datos...'
                                                    : 'No hay productos registrados.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        topProducts.map(
                                            (item, index) => {
                                                const product =
                                                    item?.productName ??
                                                    item?.name ??
                                                    item?.productId ??
                                                    item?.product ??
                                                    '-';

                                                const quantity =
                                                    item?.quantitySold ??
                                                    item?.quantity ??
                                                    item?.totalQuantity ??
                                                    item?.count ??
                                                    item?.cantidad ??
                                                    0;

                                                const sales =
                                                    item?.totalSales ??
                                                    item?.sales ??
                                                    item?.total ??
                                                    item?.totalAmount ??
                                                    0;

                                                return (
                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <td data-label="#">
                                                            <span className="badge bg-secondary">
                                                                {index +
                                                                    1}
                                                            </span>
                                                        </td>

                                                        <td data-label="Producto">
                                                            {product}
                                                        </td>

                                                        <td
                                                            data-label="Cantidad Vendida"
                                                            className="text-success fw-bold"
                                                        >
                                                            {formatNumber(
                                                                quantity
                                                            )}
                                                        </td>

                                                        <td
                                                            data-label="Total Ventas"
                                                            className="text-success fw-bold"
                                                        >
                                                            {formatCurrency(
                                                                sales
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </AuthenticatedTemplate>
        </main>
    );
};