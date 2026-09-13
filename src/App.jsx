import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation
} from 'react-router-dom';

import './App.css';

import { Header } from './components/Header';
import { Footer } from './components/Footer';

import { HomeView } from './views/HomeView';
import { AuditView } from './views/AuditView';
import { OrdersPage } from './views/OrdersPage';
import { CatalogPage } from './views/CatalogView.jsx';
import { ReportsPage } from './views/ReportView.jsx';

import { ProtectedRoute } from './components/ProtectedRoute';

function RouteDebugger() {
    const location = useLocation();

    console.log(
        '🟢 ROUTER - Ruta actual:',
        location.pathname
    );

    return null;
}

export default function App() {
    return (
        <Router>
            <RouteDebugger />

            <div className="app-container">
                <Header />

                <main className="main-content">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="/dashboard"
                            element={<HomeView />}
                        />

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={[
                                        'Admin',
                                        'Operator',
                                        'Customer'
                                    ]}
                                />
                            }
                        >
                            <Route
                                path="/orders"
                                element={<OrdersPage />}
                            />

                            <Route
                                path="/catalog"
                                element={<CatalogPage />}
                            />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={[
                                        'Admin',
                                        'Operator'
                                    ]}
                                />
                            }
                        >
                            <Route
                                path="/audit"
                                element={<AuditView />}
                            />

                            <Route
                                path="/report"
                                element={<ReportsPage />}
                            />
                        </Route>

                        <Route
                            path="/reports"
                            element={
                                <Navigate
                                    to="/report"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}