
export function ErrorView({ errorMessage, onRetry }) {
  return (
    <div>
      <div className='h1__fondo' style={{ backgroundColor: 'rgba(180, 0, 0, 0.85)' }}>
        <h1> Error de Autenticación</h1>
      </div>

      <div className='forms' style={{ borderColor: '#ff4d4d' }}>
        <p style={{ color: '#ff9999', fontWeight: 'bold', fontSize: '16px' }}>
          No se pudo validar tu cuenta institucional.
        </p>
        
        <div style={{ 
          background: 'rgba(0,0,0,0.4)', 
          padding: '10px', 
          borderRadius: '8px', 
          margin: '12px 0',
          fontSize: '12px',
          color: '#ffcccc',
          wordBreak: 'break-word'
        }}>
          <strong>Detalle del error:</strong> {errorMessage}
        </div>

        <button 
          onClick={onRetry} 
          style={{ outlineColor: '#ff4d4d' }}
        >
          Reintentar Inicio de Sesión
        </button>
      </div>
    </div>
  );
}