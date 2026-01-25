import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Unit tests are co-located with source files
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',      // Exclude test files
        'src/test-*.js',         // Exclude visual test scripts
        'src/index.ts'           // Exclude main export file
      ]
    }
  }
});
