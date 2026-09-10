import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige llamadas a /api/orders al puerto 8081
      '/api/orders': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // Redirige llamadas a /api/audit al puerto 8083 (ms-audit)
      '/api/audit': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})