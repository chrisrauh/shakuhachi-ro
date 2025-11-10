import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  server: {
    fs: {
      // Allow serving files from the parent directory (for SVGs)
      allow: ['..']
    }
  },

  optimizeDeps: {
    include: ['lit']
  },

  build: {
    rollupOptions: {
      output: {
        // Separate chunks for better caching
        manualChunks: {
          'lit': ['lit'],
          'music-components': ['$components/web-components/music-note.ts']
        }
      }
    }
  }
});
