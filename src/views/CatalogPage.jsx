import React, { useState, useEffect } from 'react';
import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
    useMsal
} from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest } from '../config/authConfig';
import { useApi } from '../hooks/useApi';

// ============================================================
// CONFIGURACIÓN API
// ============================================================

const API_BASE =
    import.meta.env.VITE_CATALOG_API_BASE_URL ||
    'http://localhost:8087';

const PRODUCTS_API_URL =
    `${API_BASE}/api/catalog/productos`;


export const CatalogPage = () => {

    const { instance, accounts, inProgress } = useMsal();
    const { fetchWithToken } = useApi();

    const account = accounts[0];

    // ============================================================
    // ROLES MSAL
    // ============================================================

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
        ['admin', 'administrator', 'administrador']
            .includes(String(role).toLowerCase())
    );

    const isOperator = userRoles.some(role =>
        ['operator', 'operador']
            .includes(String(role).toLowerCase())
    );

    const isCustomer = userRoles.some(role =>
        ['customer', 'cliente']
            .includes(String(role).toLowerCase())
    ) || (!isAdmin && !isOperator);


    // ============================================================
    // PERMISOS
    // ============================================================

    // Administrador: CRUD completo
    const canCreate = isAdmin;
    const canEdit = isAdmin;
    const canDelete = isAdmin;

    // Administrador y operador pueden modificar stock
    const canUpdateStock = isAdmin || isOperator;


    // ============================================================
    // ESTADOS
    // ============================================================

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [searchTerm, setSearchTerm] = useState('');


    // ============================================================
    // FORMULARIO
    // ============================================================

    const [productId, setProductId] = useState('');
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productStock, setProductStock] = useState('');

    // ID del producto que estamos editando
    const [editingId, setEditingId] = useState(null);


    // ============================================================
    // CARGA INICIAL
    // ============================================================

    useEffect(() => {

        if (accounts.length > 0) {
            fetchProducts();
        }

    }, [accounts]);


    // ============================================================
    // LOGIN
    // ============================================================

    const handleLogin = () => {

        if (inProgress === InteractionStatus.None) {

            instance
                .loginRedirect(loginRequest)
                .catch((e) => console.error(e));

        }

    };


    // ============================================================
    // LISTAR PRODUCTOS
    // GET /api/catalog/productos
    // ============================================================

    const fetchProducts = async () => {

        setLoading(true);
        setErrorMsg('');

        try {

            const response =
                await fetchWithToken(PRODUCTS_API_URL);

            if (response.ok) {

                const data = await response.json();

                setProducts(
                    Array.isArray(data)
                        ? data
                        : [data]
                );

            } else {

                setErrorMsg(
                    `Error ${response.status}: No se pudieron obtener los productos.`
                );

            }

        } catch (err) {

            console.error(
                'Error al consultar productos:',
                err
            );

            setErrorMsg(
                'Error de conexión o autenticación al consultar el catálogo.'
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LIMPIAR FORMULARIO
    // ============================================================

    const resetForm = () => {

        setProductId('');
        setProductName('');
        setProductPrice('');
        setProductStock('');

        setEditingId(null);

    };


    // ============================================================
    // CREAR PRODUCTO
    // POST /api/catalog/productos
    // ============================================================

    const handleCreateProduct = async (e) => {

        e.preventDefault();

        setErrorMsg('');
        setSuccessMsg('');


        // Validaciones

        if (
            !productId.trim() ||
            !productName.trim() ||
            productPrice === '' ||
            productStock === ''
        ) {

            setErrorMsg(
                'Debes completar todos los campos del producto.'
            );

            return;

        }


        if (Number(productPrice) < 0) {

            setErrorMsg(
                'El precio no puede ser negativo.'
            );

            return;

        }


        if (Number(productStock) < 0) {

            setErrorMsg(
                'El stock no puede ser negativo.'
            );

            return;

        }


        setLoading(true);

        try {

            const response = await fetchWithToken(
                PRODUCTS_API_URL,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        id: productId.trim(),
                        name: productName.trim(),
                        price: Number(productPrice),
                        stock: Number(productStock)
                    })
                }
            );


            if (response.ok) {

                setSuccessMsg(
                    `Producto "${productName}" creado exitosamente.`
                );

                resetForm();

                await fetchProducts();

            } else {

                const errorText =
                    await response.text();

                setErrorMsg(
                    errorText ||
                    `No se pudo crear el producto (HTTP ${response.status}).`
                );

            }

        } catch (err) {

            console.error(
                'Error al crear producto:',
                err
            );

            setErrorMsg(
                'Error al conectar con el microservicio de catálogo.'
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // PREPARAR EDICIÓN
    // ============================================================

    const handleEditClick = (product) => {

        setEditingId(product.id);

        setProductId(product.id);
        setProductName(product.name || '');
        setProductPrice(product.price ?? '');
        setProductStock(product.stock ?? '');

        setErrorMsg('');
        setSuccessMsg('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    };


    // ============================================================
    // ACTUALIZAR PRODUCTO
    // PUT /api/catalog/productos/{id}
    // ============================================================

    const handleUpdateProduct = async (e) => {

        e.preventDefault();

        setErrorMsg('');
        setSuccessMsg('');


        if (
            !productName.trim() ||
            productPrice === '' ||
            productStock === ''
        ) {

            setErrorMsg(
                'Debes completar todos los campos del producto.'
            );

            return;

        }


        if (Number(productPrice) < 0) {

            setErrorMsg(
                'El precio no puede ser negativo.'
            );

            return;

        }


        if (Number(productStock) < 0) {

            setErrorMsg(
                'El stock no puede ser negativo.'
            );

            return;

        }


        setLoading(true);

        try {

            const response = await fetchWithToken(
                `${PRODUCTS_API_URL}/${editingId}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        id: productId,
                        name: productName.trim(),
                        price: Number(productPrice),
                        stock: Number(productStock)
                    })
                }
            );


            if (response.ok) {

                setSuccessMsg(
                    `Producto "${productId}" actualizado exitosamente.`
                );

                resetForm();

                await fetchProducts();

            } else {

                const errorText =
                    await response.text();

                setErrorMsg(
                    errorText ||
                    `No se pudo actualizar el producto (HTTP ${response.status}).`
                );

            }

        } catch (err) {

            console.error(
                'Error al actualizar producto:',
                err
            );

            setErrorMsg(
                'Error al actualizar el producto.'
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // ELIMINAR PRODUCTO
    // DELETE /api/catalog/productos/{id}
    // ============================================================

    const handleDeleteProduct = async (id, name) => {

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar el producto "${name}"?`
        );


        if (!confirmed) {
            return;
        }


        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');


        try {

            const response = await fetchWithToken(
                `${PRODUCTS_API_URL}/${id}`,
                {
                    method: 'DELETE'
                }
            );


            if (response.ok) {

                setSuccessMsg(
                    `Producto "${name}" eliminado exitosamente.`
                );

                await fetchProducts();

            } else {

                const errorText =
                    await response.text();

                setErrorMsg(
                    errorText ||
                    `No se pudo eliminar el producto (HTTP ${response.status}).`
                );

            }

        } catch (err) {

            console.error(
                'Error al eliminar producto:',
                err
            );

            setErrorMsg(
                'Error al eliminar el producto.'
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // ACTUALIZAR STOCK
    // PATCH /api/catalog/productos/{id}/stock?stock=X
    // ============================================================

    const handleUpdateStock = async (product) => {

        const newStock = window.prompt(
            `Ingrese el nuevo stock para "${product.name}":`,
            product.stock
        );


        // Cancelar
        if (newStock === null) {
            return;
        }


        // Validación

        if (
            newStock.trim() === '' ||
            Number.isNaN(Number(newStock)) ||
            Number(newStock) < 0 ||
            !Number.isInteger(Number(newStock))
        ) {

            setErrorMsg(
                'Debes ingresar un stock válido. El valor debe ser un número entero mayor o igual a 0.'
            );

            return;

        }


        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');


        try {

            const response = await fetchWithToken(
                `${PRODUCTS_API_URL}/${product.id}/stock?stock=${Number(newStock)}`,
                {
                    method: 'PATCH'
                }
            );


            if (response.ok) {

                setSuccessMsg(
                    `Stock de "${product.name}" actualizado a ${Number(newStock)} unidades.`
                );

                await fetchProducts();

            } else {

                const errorText =
                    await response.text();

                setErrorMsg(
                    errorText ||
                    `No se pudo actualizar el stock (HTTP ${response.status}).`
                );

            }

        } catch (err) {

            console.error(
                'Error al actualizar stock:',
                err
            );

            setErrorMsg(
                'Error al actualizar el stock.'
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // BUSCADOR
    // ============================================================

    const filteredProducts = products.filter((product) => {

        const search =
            searchTerm
                .toLowerCase()
                .trim();


        if (!search) {
            return true;
        }


        return (
            String(product.id)
                .toLowerCase()
                .includes(search)
            ||
            String(product.name)
                .toLowerCase()
                .includes(search)
        );

    });


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <main>

            {/* ==================================================
                USUARIO NO AUTENTICADO
            ================================================== */}

            <UnauthenticatedTemplate>

                <h1>Autenticación Requerida</h1>

                <div className="forms__box text-center margin__flex">

                    <button
                        type="button"
                        className="btn__filter"
                        onClick={handleLogin}
                    >
                        Iniciar Sesión con Microsoft
                    </button>

                </div>

            </UnauthenticatedTemplate>


            {/* ==================================================
                USUARIO AUTENTICADO
            ================================================== */}

            <AuthenticatedTemplate>

                {/* TÍTULO */}

                <div className="h1__fondo">

                    <h1>Gestión de Catálogo</h1>

                </div>


                {/* ==================================================
                    INFORMACIÓN DEL USUARIO / ROL
                ================================================== */}

                <div className="forms__box">

                    <div className="inputs__row">

                        <div className="filter__group">

                            <label>Usuario:</label>

                            <span className="text-white">

                                {account?.name ||
                                    account?.username ||
                                    'Usuario Autenticado'}

                            </span>

                        </div>


                        <div className="filter__group">

                            <label>Rol:</label>

                            <span
                                className={`badge ${
                                    isAdmin
                                        ? 'bg-danger'
                                        : isOperator
                                            ? 'bg-warning text-dark'
                                            : 'bg-info text-dark'
                                }`}
                            >

                                {isAdmin
                                    ? 'ADMIN'
                                    : isOperator
                                        ? 'OPERADOR'
                                        : 'CLIENTE'}

                            </span>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    FORMULARIO CREAR / EDITAR
                ================================================== */}

                {(canCreate || canEdit) && (

                    <div className="forms__box">

                        <form
                            onSubmit={
                                editingId
                                    ? handleUpdateProduct
                                    : handleCreateProduct
                            }
                        >

                            <h5 className="text-white mb-4">

                                {editingId
                                    ? `Editar Producto: ${editingId}`
                                    : 'Crear Nuevo Producto'}

                            </h5>


                            <div className="inputs__row">

                                {/* ID */}

                                <div className="filter__group">

                                    <label htmlFor="productId">
                                        ID Producto:
                                    </label>

                                    <input
                                        type="text"
                                        id="productId"
                                        value={productId}
                                        onChange={(e) =>
                                            setProductId(e.target.value)
                                        }
                                        disabled={!!editingId}
                                        placeholder="Ej: PROD-001"
                                    />

                                </div>


                                {/* NOMBRE */}

                                <div className="filter__group">

                                    <label htmlFor="productName">
                                        Nombre:
                                    </label>

                                    <input
                                        type="text"
                                        id="productName"
                                        value={productName}
                                        onChange={(e) =>
                                            setProductName(e.target.value)
                                        }
                                        placeholder="Nombre del producto"
                                    />

                                </div>


                                {/* PRECIO */}

                                <div className="filter__group">

                                    <label htmlFor="productPrice">
                                        Precio:
                                    </label>

                                    <input
                                        type="number"
                                        id="productPrice"
                                        min="0"
                                        step="0.01"
                                        value={productPrice}
                                        onChange={(e) =>
                                            setProductPrice(e.target.value)
                                        }
                                        placeholder="0"
                                    />

                                </div>


                                {/* STOCK */}

                                <div className="filter__group">

                                    <label htmlFor="productStock">
                                        Stock:
                                    </label>

                                    <input
                                        type="number"
                                        id="productStock"
                                        min="0"
                                        step="1"
                                        value={productStock}
                                        onChange={(e) =>
                                            setProductStock(e.target.value)
                                        }
                                        placeholder="0"
                                    />

                                </div>

                            </div>


                            {/* BOTONES */}

                            <div
                                className="inputs__row"
                                style={{
                                    marginTop: '15px',
                                    gap: '10px'
                                }}
                            >

                                <button
                                    type="submit"
                                    className="btn__filter"
                                    disabled={loading}
                                >

                                    {loading
                                        ? 'Procesando...'
                                        : editingId
                                            ? 'Guardar Cambios'
                                            : '+ Crear Producto'}

                                </button>


                                {editingId && (

                                    <button
                                        type="button"
                                        className="btn__filter"
                                        onClick={resetForm}
                                        disabled={loading}
                                        style={{
                                            backgroundColor:
                                                'rgba(225, 29, 72, 0.1)'
                                        }}
                                    >
                                        Cancelar Edición
                                    </button>

                                )}


                                <button
                                    type="button"
                                    className="btn__filter"
                                    onClick={fetchProducts}
                                    disabled={loading}
                                    style={{
                                        backgroundColor:
                                            'rgba(225, 29, 72, 0.1)'
                                    }}
                                >
                                    Recargar Lista
                                </button>

                            </div>

                        </form>

                    </div>

                )}


                {/* ==================================================
                    MENSAJES
                ================================================== */}

                {errorMsg && (

                    <div className="alert alert-danger my-3">

                        {errorMsg}

                    </div>

                )}


                {successMsg && (

                    <div className="alert alert-success my-3">

                        {successMsg}

                    </div>

                )}


                {/* ==================================================
                    TABLA DE PRODUCTOS
                ================================================== */}

                <div className="table-glass-container mt-4">


                    {/* BUSCADOR */}

                    <div
                        className="filter__group mb-3"
                        style={{
                            maxWidth: '400px'
                        }}
                    >

                        <label htmlFor="searchProduct">

                            Buscar Producto:

                        </label>

                        <input
                            type="text"
                            id="searchProduct"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                            placeholder="Buscar por ID o nombre..."
                        />

                    </div>


                    {/* CONTADOR */}

                    <div className="mb-3 text-muted">

                        Mostrando{' '}

                        <strong className="text-white">

                            {filteredProducts.length}

                        </strong>{' '}

                        de{' '}

                        <strong className="text-white">

                            {products.length}

                        </strong>{' '}

                        productos.

                    </div>


                    {/* TABLA */}

                    <table className="custom-glass-table">

                        <thead>

                            <tr>

                                <th>ID Producto</th>

                                <th>Nombre</th>

                                <th>Precio</th>

                                <th>Stock</th>

                                {(canUpdateStock ||
                                    canEdit ||
                                    canDelete) && (

                                    <th>Acciones</th>

                                )}

                            </tr>

                        </thead>


                        <tbody>

                            {filteredProducts.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={
                                            canUpdateStock ||
                                            canEdit ||
                                            canDelete
                                                ? 5
                                                : 4
                                        }
                                        className="text-center py-4 text-muted"
                                    >

                                        {loading
                                            ? 'Cargando productos...'
                                            : products.length === 0
                                                ? 'No hay productos registrados.'
                                                : 'No se encontraron productos.'}

                                    </td>

                                </tr>

                            ) : (

                                filteredProducts.map((product) => (

                                    <tr key={product.id}>

                                        {/* ID */}

                                        <td data-label="ID Producto">

                                            {product.id}

                                        </td>


                                        {/* NOMBRE */}

                                        <td data-label="Nombre">

                                            <strong className="text-white">

                                                {product.name}

                                            </strong>

                                        </td>


                                        {/* PRECIO */}

                                        <td
                                            data-label="Precio"
                                            className="text-success fw-bold"
                                        >

                                            $
                                            {Number(
                                                product.price || 0
                                            ).toLocaleString(
                                                'es-CL'
                                            )}

                                        </td>


                                        {/* STOCK */}

                                        <td data-label="Stock">

                                            <span
                                                className={`badge ${
                                                    Number(product.stock) === 0
                                                        ? 'bg-danger'
                                                        : Number(product.stock) <= 5
                                                            ? 'bg-warning text-dark'
                                                            : 'bg-success'
                                                }`}
                                            >

                                                {product.stock}

                                            </span>

                                        </td>


                                        {/* ACCIONES */}

                                        {(canUpdateStock ||
                                            canEdit ||
                                            canDelete) && (

                                            <td data-label="Acciones">

                                                <div
                                                    className="d-flex flex-wrap gap-2"
                                                >

                                                    {/* ACTUALIZAR STOCK */}

                                                    {canUpdateStock && (

                                                        <button
                                                            type="button"
                                                            className="btn__filter"
                                                            onClick={() =>
                                                                handleUpdateStock(
                                                                    product
                                                                )
                                                            }
                                                            disabled={loading}
                                                            style={{
                                                                backgroundColor:
                                                                    'rgba(225, 29, 72, 0.1)'
                                                            }}
                                                        >

                                                            Stock

                                                        </button>

                                                    )}


                                                    {/* EDITAR */}

                                                    {canEdit && (

                                                        <button
                                                            type="button"
                                                            className="btn__filter"
                                                            onClick={() =>
                                                                handleEditClick(
                                                                    product
                                                                )
                                                            }
                                                            disabled={loading}
                                                            style={{
                                                                backgroundColor:
                                                                    'rgba(225, 29, 72, 0.1)'
                                                            }}
                                                        >

                                                            Editar

                                                        </button>

                                                    )}


                                                    {/* ELIMINAR */}

                                                    {canDelete && (

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() =>
                                                                handleDeleteProduct(
                                                                    product.id,
                                                                    product.name
                                                                )
                                                            }
                                                            disabled={loading}
                                                        >

                                                            Eliminar

                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        )}

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ==================================================
                    MENSAJE PARA CLIENTE
                ================================================== */}

                {isCustomer && (

                    <div className="forms__box mt-4">

                        <p className="text-white mb-0">

                            <strong>Modo Cliente:</strong>{' '}

                            Puedes consultar los productos,
                            precios y disponibilidad del catálogo.
                            Las acciones de administración están
                            restringidas según tu rol.

                        </p>

                    </div>

                )}

            </AuthenticatedTemplate>

        </main>
    );
};

