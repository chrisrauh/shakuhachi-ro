import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  root: '.',
  srcDir: './src',
  publicDir: './public',
  outDir: './dist',
  site: 'https://shakuhachi.ro',
  base: '/',
  devToolbar: {
    enabled: false,
  },
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
