import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

export function ProtectedRoute({ allowedRoles }) {
    const { accounts } = useMsal();
    const account = accounts[0];
    if (!account) {
        return <Navigate to="/" replace />;
    }
    const rawRoles = account?.idTokenClaims?.roles || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    const hasPermission = userRoles.some(role =>
        allowedRoles.map(r => r.toLowerCase()).includes(String(role).toLowerCase())
    );
    if (!hasPermission) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}