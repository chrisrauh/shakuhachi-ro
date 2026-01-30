import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
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
        testCrud: './test-crud.html',
        testMeriKari: './test-meri-kari.html',
        testMeriSimple: './test-meri-simple.html',
        testModifierCombinations: './test-modifier-combinations.html',
        testOctaveMarks: './test-octave-marks.html',
      },
    },
  },
}));
