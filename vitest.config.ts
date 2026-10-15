import { defineConfig } from 'vitest/config';

// Suites: tests/unit/ (lógica pura) e tests/integration/ (CLI como proceso
// con HOME/USERPROFILE temporal — research.md R9/R10).
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
