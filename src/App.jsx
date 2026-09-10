import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuditView } from './views/AuditView';
import { OrdersPage } from './views/OrdersPage';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/audit" element={<AuditView />} />
            <Route 
              path="/dashboard" 
              element={
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Dashboard (Home)</h2>
                  <p>Próximamente métricas y resumen de pedidos.</p>
                </div>
              } 
            />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}