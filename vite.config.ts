/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the production build portable (open dist/ from any static host).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: false },
  build: { chunkSizeWarningLimit: 1200 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
