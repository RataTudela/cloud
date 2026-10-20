# Pedidos360 - Frontend App

Interfaz web principal del sistema Pedidos360, desarrollada para interactuar con la arquitectura de microservicios (`ms-orders`, `ms-catalog`, `ms-audit`, `ms-report`, etc.) y gestionar el control de acceso de usuarios.


##Autenticación con MSAL

La aplicación utiliza **MSAL (Microsoft Authentication Library)** para la gestión del flujo de autenticación mediante Microsoft Entra ID / Azure AD:

* **Inicio de Sesión:** Redirige al usuario al portal de autenticación seguro de Microsoft.
* **Tokens JWT:** Gestiona y adjunta automáticamente los tokens Bearer en cada petición HTTP dirigida hacia los microservicios backend.
* **Persistencia de Sesión:** Si los tokens expiran o se limpia el estado del backend/Docker, puede requerir cerrar sesión y reautenticarse para renovar el token activo.

---

## 1. Ejecución en Entorno Local (Modo Prioritario)

### Prerrequisitos OBLIGATORIOS
Para que la interfaz funcione de manera integral (cargar productos, crear órdenes, ver auditoría y reportes), **es indispensable tener corriendo en paralelo e
el sistem de microservicios backend** en Docker, Asegurar  haber levantado previamente los contenedores desde la infraestructura central (`ms-orders`).

### Pasos de Inicio:

1. **Instalar dependencias del proyecto:**
   npm install
Levantar el servidor de desarrollo local:

npm run dev
Acceso:
Abre la aplicación en tu navegador ingresando a la URL local indicada en la consola (por defecto http://localhost:5173).

2. Entorno AWS y Despliegue
Cambio de Rama
Para revisar la configuración orientada a producción / AWS, debes cambiar a la rama de despliegue correspondiente:

aws cloud
AVISO IMPORTANTE SOBRE ACCESO EN AWS
Restricción de Cuenta Personal:

La infraestructura de AWS y el registro de la aplicación en MSAL Azure AD están vinculados a mi cuenta personal de AWS y Microsoft Azure.

Por esta razón, no será posible iniciar sesión ni ingresar a la aplicación desplegada en la nube con credenciales externas, ya que los permisos de autenticación y los dominios permitidos están restringidos exclusivamente hacia mi.

Para probar el sistema utilizar el entorno Local.
