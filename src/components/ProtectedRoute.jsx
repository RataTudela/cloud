import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';

export function ProtectedRoute({ allowedRoles }) {

    const {
        accounts,
        inProgress
    } = useMsal();

    const location = useLocation();

    console.log('==============================');
    console.log('PROTECTED ROUTE');
    console.log('Ruta actual:', location.pathname);
    console.log('MSAL:', inProgress);
    console.log('Cuentas:', accounts.length);
    if (inProgress !== InteractionStatus.None) {

        console.log(
            '⏳ MSAL todavía está procesando:',
            inProgress
        );

        return (
            <div className="container mt-5">
                <div className="forms__box text-center">

                    <h2 className="h1__fondo">
                        Verificando sesión...
                    </h2>

                    <p className="text-muted">
                        Esperando autenticación de Microsoft.
                    </p>

                </div>
            </div>
        );
    }

    const account = accounts[0];

    console.log('Cuenta después de MSAL:', account);

    if (!account) {

        console.log(
            '❌ No existe una cuenta después de finalizar MSAL'
        );

        return (
            <Navigate
                to="/dashboard"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );
    }

    const rawRoles =
        account?.idTokenClaims?.roles ||
        account?.idTokenClaims?.[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] ||
        [];

    const userRoles = Array.isArray(rawRoles)
        ? rawRoles
        : [rawRoles];

    const normalizedUserRoles = userRoles.map(role =>
        String(role)
            .trim()
            .toLowerCase()
    );

    const normalizedAllowedRoles = allowedRoles.map(role =>
        String(role)
            .trim()
            .toLowerCase()
    );

    const hasPermission = normalizedUserRoles.some(role =>
        normalizedAllowedRoles.includes(role)
    );

    console.log('Roles del usuario:', userRoles);
    console.log('Roles permitidos:', allowedRoles);
    console.log('Tiene permiso:', hasPermission);

    if (!hasPermission) {

        console.log(
            '❌ Usuario autenticado pero sin permisos'
        );

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    console.log(
        '✅ ACCESO PERMITIDO:',
        location.pathname
    );

    return <Outlet />;
}