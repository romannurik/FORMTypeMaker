import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'app',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/index.html'),
        rotater: resolve(__dirname, 'app/rotater.html'),
        test: resolve(__dirname, 'app/test.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: true
  }
});
