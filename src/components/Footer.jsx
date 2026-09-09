import React from 'react';

export function Footer() {
    return (
    <footer className="footer">
        <div className="footer__container">
            <div className="footer__brand">
            <span className="footer__title">PEDIDOS 360</span>
            <p className="footer__subtitle">Módulo de Auditoría y Trazabilidad en Tiempo Real</p>
            </div>

            <div className="footer__status">
            <span className="status__dot"></span>
            <span>Sistema de Auditoría Operativo</span>
            </div>

            <div className="footer__copy">
            &copy; {new Date().getFullYear()} Pedidos360. Todos los derechos reservados.
            </div>
        </div>
        </footer>
    );
    }