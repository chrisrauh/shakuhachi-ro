import { defineConfig } from 'vite';

/**
 * Vite configuration for building the embeddable shakuhachi-score web component
 *
 * Output: /public/embed/shakuhachi-score.js (IIFE format)
 * Usage: <script src="/embed/shakuhachi-score.js"></script>
 *
 * Built straight into `public/` — where the dev server, the visual suite
 * and `astro build` all read it from — and gitignored rather than committed.
 */
export default defineConfig({
  // outDir lives inside public/ — without this Vite would copy public/ into itself
  publicDir: false,
  build: {
    lib: {
      entry: 'src/web-component/ShakuhachiScore.ts',
      name: 'ShakuhachiScore',
      formats: ['iife'],
      fileName: () => 'shakuhachi-score.js',
    },
    outDir: 'public/embed',
    // The directory is wholly owned by this build — nothing else may live there
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
