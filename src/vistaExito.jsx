import { ProtectedData } from './ProtectedData';
import './App.css'

export function SuccessView({ currentUser, onLogout }) {
  return (
    <div>
      <div className='h1__fondo' style={{ backgroundColor: 'rgba(0, 128, 0, 0.8)' }}>
        <h1> Autenticación Exitosa</h1>
      </div>
      
      <div className='forms' style={{ borderColor: '#02d614' }}>
        <p style={{ fontSize: '32px', color: '#fff' }}>
          ¡Bienvenido, <strong>{currentUser?.name || currentUser?.username}</strong>!
        </p>

        <div className='circle'>
          <div className='cirlce__center'></div>
        </div>

        <hr style={{ margin: '1rem 0', borderColor: 'rgba(255,255,255,0.2)' }} />
        
        {/* Muestra los datos de la API protegida */}
        <ProtectedData />

        <button onClick={onLogout} style={{ marginTop: '12px' }}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}