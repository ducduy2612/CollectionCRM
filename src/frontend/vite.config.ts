import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces to allow Docker port mapping
    port: 5173,
    allowedHosts: ['.daytona.work'],
    proxy: {
      '/api': {
        target: 'http://api-gateway:3000',
        changeOrigin: true,
      },
    },
  },
  // @ts-ignore - Vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});