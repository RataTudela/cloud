import React from 'react';

export function Header() {
    return (
        <header>
        <nav className="header__nav">
            <div className="logo">
                <div className="logo__into">
                        <i class="fa-solid fa-shopping-cart carrito-rojo"></i>
                </div>
            </div>
            <ul className="nav__list">
            <li className="list__items">
                <a href="/dashboard" className="item__link">Home</a>
            </li>
            <li className="list__items">
                <a href="/orders" className="item__link">Pedidos</a>
            </li>
            <li className="list__items">
                <a href="/audit" className="item__link">Auditoría</a>
            </li>
            </ul>
        </nav>
        </header>
    );
}