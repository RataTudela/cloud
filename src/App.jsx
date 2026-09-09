import React from 'react';
import './App.css';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuditView } from './views/AuditView';
import { OrdersPage } from './views/OrdersPage';

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <OrdersPage />
      <Footer />
    </div>
  );
}