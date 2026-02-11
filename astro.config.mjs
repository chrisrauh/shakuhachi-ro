import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
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
