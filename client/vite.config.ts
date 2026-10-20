import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite reenvía la API y las fotos al servidor Express (puerto 4000).
const apiTarget = `http://localhost:${process.env.API_PORT ?? 4000}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Puerto de la API configurable con API_PORT (por defecto 4000).
      '/api': apiTarget,
      '/uploads': apiTarget,
    },
  },
});
