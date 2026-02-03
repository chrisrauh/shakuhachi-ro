import { defineConfig } from 'vite';

export default defineConfig(({ mode: _mode }) => ({
  root: './',
  base: '/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        editor: './editor.html',
        score: './score.html',
        seedDatabase: './seed-database.html',
      },
    },
  },
}));
