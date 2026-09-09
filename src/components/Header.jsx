import React from 'react';

export function Header() {
    return (
        <header>
        <nav className="header__nav">
            <div className="logo">
            <div className="logo__into">
                <img 
                src="https://media1.tenor.com/m/UMr2aYv-rIMAAAAC/portal.gif" 
                alt="Pedidos360 Logo" 
                />
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