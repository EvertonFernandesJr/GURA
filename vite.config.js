import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: '/login.html',
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        notas: resolve(__dirname, 'notas-professores.html'),
        grade: resolve(__dirname, 'gerenciador-grade.html'),
      },
    },
  },
});
