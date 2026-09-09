import React, { useState } from 'react';

export function AuditView() {
    // Estado para capturar los filtros
    const [filters, setFilters] = useState({
        usuario: '',
        fechaInicio: '',
        fechaFin: '',
        evento: 'todo'
    });

    const handleChange = (e) => {
        setFilters({
        ...filters,
        [e.target.id || e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Filtrando eventos de auditoría con:', filters);
        // Aquí harás la petición a tu API de Auditoría
    };

    return (
        <main>
        <h1>Timeline de Auditoría</h1>

        <div className="forms__box">
            <form onSubmit={handleSubmit}>
            <div className="inputs__row">
            {/* Filtro Usuario */}
                <div className="filter__group">
                <label htmlFor="usuario">Usuario:</label>
                <input 
                    type="text" 
                    id="usuario" 
                    placeholder="Juanceto Pillo" 
                    value={filters.usuario}
                    onChange={handleChange}
                />
                </div>

            {/* Filtro Rango de Fechas */}
                <div className="filter__group">
                <label>Rango de Fechas:</label>
                <div className="date__range">
                    <input 
                    type="date" 
                    name="fechaInicio" 
                    value={filters.fechaInicio}
                    onChange={handleChange}
                    />
                    <span>a</span>
                    <input 
                    type="date" 
                    name="fechaFin" 
                    value={filters.fechaFin}
                    onChange={handleChange}
                    />
                </div>
                </div>

            {/* Filtro Tipo de Evento */}
            <div className="filter__group">
                <label htmlFor="evento">Tipo de Evento:</label>
                <select 
                    id="evento" 
                    value={filters.evento}
                    onChange={handleChange}>
                    <option value="todo">Todos Los Eventos</option>
                    <option value="ordenCreate">Orden Creada</option>
                    <option value="ordenAccepted">Orden Aceptada</option>
                    <option value="ordenPrepared">Orden Preparada</option>
                    <option value="ordenDispatched">Orden Enviada</option>
                    <option value="ordenDelivery">Orden Entregada</option>
                        <option value="ordenDelete">Orden Eliminada / Cancelada</option>
                    </select>
                </div>
            </div>

            <button type="submit" className="btn__filter">
                Filtrar
            </button>
            </form>
        </div>
        </main>
    );
}