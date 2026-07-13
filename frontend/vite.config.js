import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Solo para `npm run dev` fuera de Docker. En los contenedores, Nginx hace
  // de proxy de /api hacia el servicio `api`.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
