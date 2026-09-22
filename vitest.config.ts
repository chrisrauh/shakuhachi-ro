import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Unit tests are co-located with source files
    include: ['src/**/*.test.ts', 'src/**/*.test.js'],
    // src/api/supabase.ts throws at module scope when these are missing, so
    // any test that transitively imports it fails without a .env — including
    // automocked ones, since vi.mock still loads the real module to derive
    // its shape. Every test mocks Supabase, so these are placeholders that
    // are never connected to; they keep the suite hermetic and runnable in a
    // fresh worktree, where .env (gitignored) does not exist.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'dummy-anon-key-for-tests',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.js'],
      exclude: [
        'src/**/*.test.ts', // Exclude test files
        'src/**/*.test.js', // Exclude test files
        'src/test-*.js', // Exclude visual test scripts
        'src/index.ts', // Exclude main export file
      ],
    },
  },
});
