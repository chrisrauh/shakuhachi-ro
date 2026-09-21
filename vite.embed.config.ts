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
    // No `target`: the embed bundle takes Vite's default,
    // 'baseline-widely-available' (Baseline = supported across all core
    // browsers for 30 months). Deliberate — tracking that standard is a better
    // support policy for this bundle than a hand-pinned version list, which
    // goes stale unnoticed. The floor moves on Vite majors; check it then.
    rollupOptions: {
      external: [], // Bundle everything (no external dependencies)
    },
  },
});
