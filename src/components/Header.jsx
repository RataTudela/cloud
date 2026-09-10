import React from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header>
      <nav className="header__nav">
        <div className="logo">
          <div className="logo__into">
            <i className="fa-solid fa-shopping-cart carrito-rojo"></i>
          </div>
        </div>
        <ul className="nav__list">
          <li className="list__items">
            <Link to="/dashboard" className="item__link">Home</Link>
          </li>
          <li className="list__items">
            <Link to="/orders" className="item__link">Pedidos</Link>
          </li>
          <li className="list__items">
            <Link to="/audit" className="item__link">Auditoría</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}