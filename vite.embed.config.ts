import { defineConfig } from 'vite';

/**
 * Vite configuration for building the embeddable shakuhachi-score web component
 *
 * Output: /dist/embed/shakuhachi-score.js (IIFE format)
 * Usage: <script src="/embed/shakuhachi-score.js"></script>
 */
export default defineConfig({
  publicDir: false, // Don't copy public directory to dist/embed
  build: {
    lib: {
      entry: 'src/web-component/ShakuhachiScore.ts',
      name: 'ShakuhachiScore',
      formats: ['iife'],
      fileName: () => 'shakuhachi-score.js',
    },
    outDir: 'dist/embed',
    emptyOutDir: true,
    // Browser support floor for the public embed bundle. Pinned explicitly so
    // it stays a deliberate product decision rather than drifting with Vite's
    // default target, which has risen twice (v7: Chrome 87->107, Safari
    // 14->16.0; v8: Chrome 107->111, Safari 16.0->16.4).
    target: ['chrome87', 'safari14', 'firefox78', 'edge88'],
    rollupOptions: {
      external: [], // Bundle everything (no external dependencies)
    },
  },
});
