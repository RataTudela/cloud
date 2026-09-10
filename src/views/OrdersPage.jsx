import React, { useState, useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest } from '../config/authConfig';
import { useApi } from '../hooks/useApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
const ORDERS_API_URL = `${API_BASE}/api/orders`;
const PRODUCTS_API_URL = `${API_BASE}/api/products`;

export const OrdersPage = () => {
    const { instance, accounts, inProgress } = useMsal();
    const { fetchWithToken } = useApi();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Estados para selección de productos dentro del pedido
    const [cartItems, setCartItems] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [statusFilter, setStatusFilter] = useState('todos');

    useEffect(() => {
        if (accounts.length > 0) {
        fetchOrders();
        fetchProducts();
        }
    }, [accounts]);

    const handleLogin = () => {
        if (inProgress === InteractionStatus.None) {
        instance.loginRedirect(loginRequest).catch((e) => console.error(e));
        }
    };

    const fetchProducts = async () => {
        try {
        const response = await fetchWithToken(PRODUCTS_API_URL);
        if (response.ok) {
            const data = await response.json();
            setProducts(data);
            if (data.length > 0) {
            setSelectedProductId(data[0].id);
            }
        } else {
            console.error('No se pudieron consultar los productos.');
        }
        } catch (err) {
        console.error('Error de red al consultar productos:', err);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
        const response = await fetchWithToken(ORDERS_API_URL);
        if (response.ok) {
            const data = await response.json();
            setOrders(Array.isArray(data) ? data : [data]);
        } else {
            setErrorMsg(`Error ${response.status}: No se pudieron obtener las órdenes.`);
        }
        } catch (err) {
        setErrorMsg('Error de conexión o autenticación.');
        } finally {
        setLoading(false);
        }
    };

    const handleAddItem = () => {
        const prod = products.find(p => p.id === selectedProductId);
        if (!prod) return;

        const existingIndex = cartItems.findIndex(i => i.productId === prod.id);
        if (existingIndex >= 0) {
        const updated = [...cartItems];
        updated[existingIndex].quantity += Number(quantity);
        setCartItems(updated);
        } else {
        setCartItems([
            ...cartItems, 
            { productId: prod.id, productName: prod.name, quantity: Number(quantity), unitPrice: prod.price }
        ]);
        }
        setQuantity(1);
    };

    const handleRemoveItem = (index) => {
        setCartItems(cartItems.filter((_, i) => i !== index));
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) {
        setErrorMsg('Debes agregar al menos un producto a la orden.');
        return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
        const activeAccount = accounts[0] || instance.getActiveAccount();
        const currentUser = activeAccount?.name || activeAccount?.username || 'Usuario Autenticado';
        const newOrderId = `ORD-${Math.floor(Math.random() * 900) + 100}`;
        const totalAmount = cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

        const res = await fetchWithToken(ORDERS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            id: newOrderId,
            customer: currentUser,
            status: 'CREADO',
            description: `Orden con ${cartItems.length} producto(s)`,
            items: cartItems,
            totalAmount: totalAmount
            })
        });

        if (res.ok) {
            setSuccessMsg(`Orden ${newOrderId} creada exitosamente con total $${totalAmount.toLocaleString('es-CL')}.`);
            setCartItems([]);
            fetchOrders();
        } else {
            setErrorMsg(`Error al crear la orden (HTTP ${res.status}).`);
        }
        } catch (err) {
        setErrorMsg('Error al conectar con el microservicio.');
        } finally {
        setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
        const res = await fetchWithToken(`${ORDERS_API_URL}/${orderId}/status?newStatus=${newStatus}`, {
            method: 'PUT'
        });

        if (res.ok) {
            setSuccessMsg(`Estado de la orden ${orderId} actualizado a ${newStatus}.`);
            fetchOrders();
        } else {
            const errorText = await res.text();
            setErrorMsg(errorText || `No se pudo cambiar el estado a ${newStatus}.`);
        }
        } catch (err) {
        setErrorMsg('Error al actualizar el estado de la orden.');
        } finally {
        setLoading(false);
        }
    };

    const filteredOrders = orders.filter((o) => 
        statusFilter === 'todos' ? true : o.status === statusFilter
    );

    return (
        <main>
        <UnauthenticatedTemplate>
            <h1>Autenticación Requerida</h1>
            <div className="forms__box text-center margin__flex">
                <button type="button" className="btn__filter" onClick={handleLogin}>
                    Iniciar Sesión con Microsoft
                </button>
            </div>
        </UnauthenticatedTemplate>

        <AuthenticatedTemplate>
            <div className='h1__fondo'>
                <h1>Gestión de Pedidos</h1>
            </div>
            <div className="forms__box">
            <form onSubmit={handleCreateOrder}>
                <div className="inputs__row">
                <div className="filter__group">
                    <label htmlFor="productSelect">Producto:</label>
                    <select 
                    id="productSelect"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    disabled={products.length === 0}
                    >
                    {products.length === 0 ? (
                        <option value="">Cargando productos...</option>
                    ) : (
                        products.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} - ${p.price.toLocaleString('es-CL')} (Stock: {p.stock})
                        </option>
                        ))
                    )}
                    </select>
                </div>

                <div className="filter__group">
                    <label htmlFor="quantity">Cantidad:</label>
                    <input 
                    type="number" 
                    id="quantity" 
                    min="1" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>

                <div className="filter__group" style={{ justifyContent: 'flex-end' }}>
                    <button 
                    type="button" 
                    className="btn__filter" 
                    onClick={handleAddItem}
                    style={{ backgroundColor: 'rgba(225, 29, 72, 0.1);' }}
                    disabled={products.length === 0}
                    >
                    + Agregar Producto
                    </button>
                </div>
                </div>
                {cartItems.length > 0 && (
                <div className="mt-4">
                    <h5 className="text-white">Detalle del Pedido</h5>
                    <div className="cart-grid">
                    {cartItems.map((item, idx) => (
                        <div key={idx} className="cart-card text-white">
                        <div>
                            <p className='title'><strong className="d-block mb-1">{item.productName}</strong></p>
                            <p><span className="text-muted small">Cantidad: {item.quantity}</span></p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className="fw-bold text-success">
                            ${(item.unitPrice * item.quantity).toLocaleString('es-CL')}
                            </span>
                            <button type="button" className="btn-absolute btn btn-sm btn-outline-danger" onClick={() => handleRemoveItem(idx)}>
                            x
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                )}

                <div className="inputs__row" style={{ marginTop: '15px', gap: '10px' }}>
                <button type="submit" className="btn__filter" disabled={loading || cartItems.length === 0}>
                    {loading ? 'Procesando...' : 'Confirmar y Crear Orden'}
                </button>
                <button 
                    type="button" 
                    className="btn__filter" 
                    onClick={() => { fetchOrders(); fetchProducts(); }} 
                    disabled={loading}
                    style={{ backgroundColor: 'rgba(225, 29, 72, 0.1);' }}>
                    Recargar Lista
                </button>
                </div>
            </form>
            </div>

            {errorMsg && <div className="alert alert-danger my-3">{errorMsg}</div>}
            {successMsg && <div className="alert alert-success my-3">{successMsg}</div>}

            {/* Tabla de Resultados */}
          {/* Tabla de Resultados con Efecto Glass y Responsiva */}
            <div className="table-glass-container mt-4">
            <div className="filter__group mb-3" style={{ maxWidth: '300px' }}>
                <label htmlFor="statusFilter">Filtrar por Estado:</label>
                <select 
                id="statusFilter" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                >
                <option value="todos">Todos los Estados</option>
                <option value="CREADO">CREADO</option>
                <option value="ACEPTADO">ACEPTADO</option>
                <option value="EN_PREPARACION">EN_PREPARACION</option>
                <option value="DESPACHADO">DESPACHADO</option>
                <option value="ENTREGADO">ENTREGADO</option>
                <option value="CANCELADO">CANCELADO</option>
                </select>
            </div>

            <table className="custom-glass-table">
                <thead>
                <tr>
                    <th>ID Orden</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Cambiar Estado</th>
                </tr>
                </thead>
                <tbody>
                {filteredOrders.length === 0 ? (
                    <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                        {loading ? 'Cargando datos...' : 'No hay órdenes registradas.'}
                    </td>
                    </tr>
                ) : (
                    filteredOrders.map((o) => (
                    <tr key={o.id}>
                        <td data-label="ID Orden">{o.id}</td>
                        <td data-label="Cliente">{o.customer}</td>
                        <td data-label="Productos">
                        {o.items && o.items.length > 0 ? (
                            <ul className="mb-0 ps-3 small list-unstyled">
                            {o.items.map((it, i) => (
                                <li key={i} className="text-info">
                                • {it.productName} (x{it.quantity})
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <span className="text-muted">{o.description}</span>
                        )}
                        </td>
                        <td data-label="Total" className="text-success fw-bold">
                        ${(o.totalAmount || 0).toLocaleString('es-CL')}
                        </td>
                        <td data-label="Estado">
                        <span className={`badge ${
                            o.status === 'CREADO' ? 'bg-secondary' :
                            o.status === 'ACEPTADO' ? 'bg-info text-dark' :
                            o.status === 'EN_PREPARACION' ? 'bg-warning text-dark' :
                            o.status === 'DESPACHADO' ? 'bg-primary' :
                            o.status === 'ENTREGADO' ? 'bg-success' : 'bg-danger'
                        }`}>
                            {o.status}
                        </span>
                        </td>
                        <td data-label="Cambiar Estado">
                        <select 
                            className="form-select form-select-sm bg-dark text-white border-secondary"
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={loading}
                        >
                            <option value="CREADO">CREADO</option>
                            <option value="ACEPTADO">ACEPTADO</option>
                            <option value="EN_PREPARACION">EN_PREPARACION</option>
                            <option value="DESPACHADO">DESPACHADO</option>
                            <option value="ENTREGADO">ENTREGADO</option>
                            <option value="CANCELADO">CANCELADO</option>
                        </select>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </AuthenticatedTemplate>
        </main>
    );
};