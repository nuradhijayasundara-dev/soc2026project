import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.[jt]sx?$/ })],
  server: {
    port: 3100,
    host: true,
  },
  build: {
    outDir: 'build',
  },
});