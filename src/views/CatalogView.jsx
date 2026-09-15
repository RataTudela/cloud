import React, { useEffect, useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import { useApi } from '../hooks/useApi';

// RUTA RELATIVA: API Gateway antepondrá VITE_API_GATEWAY_URL automáticamente
const CATALOG_ENDPOINT = '/api/catalog/productos';

export function CatalogPage() {
    const { instance, accounts } = useMsal();
    const { fetchWithToken } = useApi();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [productId, setProductId] = useState('');
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productStock, setProductStock] = useState('');
    const [editingId, setEditingId] = useState(null);

    // ROLES
    const account = accounts[0] || instance.getActiveAccount();
    const rawRoles = account?.idTokenClaims?.roles || 
                     account?.idTokenClaims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    const isAdmin = userRoles.some(role => ['admin', 'administrator', 'administrador'].includes(String(role).toLowerCase()));
    const isOperator = userRoles.some(role => ['operator', 'operador'].includes(String(role).toLowerCase()));

    const canCreate = isAdmin;
    const canEdit = isAdmin;
    const canDelete = isAdmin;
    const canUpdateStock = isAdmin || isOperator;

    const handleLogin = async () => {
        try {
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setErrorMsg('No fue posible iniciar sesión.');
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const response = await fetchWithToken(CATALOG_ENDPOINT);
            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error al consultar productos:', error);
            setErrorMsg('No fue posible cargar los productos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accounts.length > 0) {
            fetchProducts();
        }
    }, [accounts]);

    const clearForm = () => {
        setProductId('');
        setProductName('');
        setProductPrice('');
        setProductStock('');
        setEditingId(null);
    };

    const handleCreateProduct = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetchWithToken(CATALOG_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify({
                    id: productId,
                    name: productName,
                    price: Number(productPrice),
                    stock: Number(productStock)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP ${response.status}`);
            }

            await response.json();
            setSuccessMsg('Producto creado correctamente.');
            clearForm();
            await fetchProducts();
        } catch (error) {
            console.error('Error al crear producto:', error);
            setErrorMsg('No fue posible crear el producto.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = (product) => {
        setEditingId(product.id);
        setProductId(product.id);
        setProductName(product.name);
        setProductPrice(product.price);
        setProductStock(product.stock);
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleUpdateProduct = async (event) => {
        event.preventDefault();
        if (!editingId) return;

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetchWithToken(`${CATALOG_ENDPOINT}/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: productId,
                    name: productName,
                    price: Number(productPrice),
                    stock: Number(productStock)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP ${response.status}`);
            }

            await response.json();
            setSuccessMsg('Producto actualizado correctamente.');
            clearForm();
            await fetchProducts();
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            setErrorMsg('No fue posible actualizar el producto.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id, name) => {
        const confirmed = window.confirm(`¿Está seguro de eliminar el producto "${name}"?`);
        if (!confirmed) return;

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetchWithToken(`${CATALOG_ENDPOINT}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP ${response.status}`);
            }

            setSuccessMsg('Producto eliminado correctamente.');
            await fetchProducts();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            setErrorMsg('No fue posible eliminar el producto.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (product) => {
        const newStock = window.prompt(`Ingrese el nuevo stock para "${product.name}":`, product.stock);
        if (newStock === null) return;

        const stockNumber = Number(newStock);
        if (!Number.isInteger(stockNumber) || stockNumber < 0) {
            setErrorMsg('El stock debe ser un número entero mayor o igual a 0.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetchWithToken(`${CATALOG_ENDPOINT}/${product.id}/stock?stock=${stockNumber}`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP ${response.status}`);
            }

            await response.json();
            setSuccessMsg('Stock actualizado correctamente.');
            await fetchProducts();
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            setErrorMsg('No fue posible actualizar el stock.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(
        product =>
            String(product.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(product.name).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <UnauthenticatedTemplate>
                <div className="container mt-5">
                    <div className="forms__box text-center">
                        <h1 className="h1__fondo">Autenticación Requerida</h1>
                        <p className="text-muted">Debes iniciar sesión para acceder al catálogo de productos.</p>
                        <button type="button" className="btn__filter" onClick={handleLogin}>
                            Iniciar Sesión con Microsoft
                        </button>
                    </div>
                </div>
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <div className="container mt-4">
                    <h1 className="h1__fondo">Gestión de Catálogo</h1>

                    {errorMsg && <div className="alert-error">{errorMsg}</div>}
                    {successMsg && <div className="alert-success">{successMsg}</div>}

                    {(canCreate || editingId) && (
                        <div className="forms__box mb-4">
                            <h3 className="form-title">
                                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>

                            <form onSubmit={editingId ? handleUpdateProduct : handleCreateProduct}>
                                <div className="inputs__row">
                                    <div className="filter__group">
                                        <label>ID Producto</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: PROD-001"
                                            value={productId}
                                            onChange={(e) => setProductId(e.target.value)}
                                            disabled={!!editingId}
                                            required
                                        />
                                    </div>

                                    <div className="filter__group">
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Notebook Lenovo"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="filter__group">
                                        <label>Precio</label>
                                        <input
                                            type="number"
                                            placeholder="Ej: 499990"
                                            value={productPrice}
                                            onChange={(e) => setProductPrice(e.target.value)}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div className="filter__group">
                                        <label>Stock</label>
                                        <input
                                            type="number"
                                            placeholder="Ej: 25"
                                            value={productStock}
                                            onChange={(e) => setProductStock(e.target.value)}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="hero-actions action-buttons-group">
                                    <button type="submit" className="btn__filter btn-submit" disabled={loading}>
                                        {editingId ? 'Actualizar' : 'Crear Producto'}
                                    </button>

                                    {editingId && (
                                        <button
                                            type="button"
                                            className="btn__filter btn-cancel"
                                            onClick={clearForm}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="forms__box mb-4">
                        <div className="filter__group">
                            <label>Buscar producto</label>
                            <input
                                type="text"
                                placeholder="Buscar por ID o nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-glass-container">
                        <table className="custom-glass-table">
                            <thead>
                                <tr>
                                    <th>ID Producto</th>
                                    <th>Nombre</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && products.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            Cargando productos...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            No se encontraron productos.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map(product => (
                                        <tr key={product.id}>
                                            <td data-label="ID Producto">{product.id}</td>
                                            <td data-label="Nombre">{product.name}</td>
                                            <td data-label="Precio">
                                                ${Number(product.price).toLocaleString('es-CL')}
                                            </td>
                                            <td data-label="Stock">
                                                <span className="badge bg-secondary">{product.stock}</span>
                                            </td>
                                            <td data-label="Acciones">
                                                <div className="d-flex gap-2 flex-wrap">
                                                    {canUpdateStock && (
                                                        <button
                                                            type="button"
                                                            className="btn__filter btn-action-table"
                                                            onClick={() => handleUpdateStock(product)}
                                                            disabled={loading}
                                                        >
                                                            Stock
                                                        </button>
                                                    )}

                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            className="btn__filter btn-action-table"
                                                            onClick={() => handleEditProduct(product)}
                                                            disabled={loading}
                                                        >
                                                            Editar
                                                        </button>
                                                    )}

                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            className="btn__filter btn-action-table btn-delete"
                                                            onClick={() => handleDeleteProduct(product.id, product.name)}
                                                            disabled={loading}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AuthenticatedTemplate>
        </>
    );
}