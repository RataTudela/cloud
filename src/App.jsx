import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AuditView } from './views/AuditView';
import { OrdersPage } from './views/OrdersPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<HomeView />} />
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Operator', 'Customer']} />}>
              <Route path="/orders" element={<OrdersPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Operator']} />}>
              <Route path="/audit" element={<AuditView />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}