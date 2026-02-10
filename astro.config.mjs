import { defineConfig } from 'astro/config';

export default defineConfig({
  root: '.',
  srcDir: './src',
  publicDir: './public',
  outDir: './dist',
  site: 'https://shakuhachi.ro',
  base: '/',
  server: {
    port: 3001,
  },
  build: {
    format: 'file', // Generates /index.html instead of /index/index.html
  },
  vite: {
    envPrefix: ['VITE_'],
  },
});
