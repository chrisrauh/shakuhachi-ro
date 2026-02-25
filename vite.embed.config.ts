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
      entry: 'src/web-components/ShakuhachiScore.ts',
      name: 'ShakuhachiScore',
      formats: ['iife'],
      fileName: () => 'shakuhachi-score.js',
    },
    outDir: 'dist/embed',
    emptyOutDir: true,
    minify: 'esbuild', // Use esbuild instead of terser (built-in)
    rollupOptions: {
      external: [], // Bundle everything (no external dependencies)
      output: {
        inlineDynamicImports: true, // Inline all imports into single file
      },
    },
  },
});
