// BASE · No se toca.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // import { calcularCostos } from '@compartido/costos.js'
    alias: { '@compartido': fileURLToPath(new URL('../compartido', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },   // el frontend le habla al backend sin CORS
    fs: { allow: ['..'] },
  },
});
