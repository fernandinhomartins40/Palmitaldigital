import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@palmital/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@palmital/utils': resolve(__dirname, '../../packages/utils/src/index.ts'),
      '@palmital/types': resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
