import { defineConfig } from 'vitest/config';
import { getResolveAlias } from './config/alias';
import { getVuePlugin } from './config/plugins/base';

export default defineConfig({
  plugins: [getVuePlugin()],
  resolve: {
    alias: getResolveAlias(),
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/setupVitest.ts'],
    globals: true,
    include: [
      'src/**/*.test.ts',
      'config/**/*.test.ts',
      'scripts/**/*.test.ts',
      'scripts/**/*.test.mjs',
      'tests/e2e/**/*.test.mjs',
      'playwright.*.test.ts',
      'eslint.config.test.ts',
    ],
    // Playwright specs (always `.spec.ts`) must never run as vitest tests;
    // colocated `.test.mjs` fixture-logic tests under `tests/e2e/**` are
    // deliberately not excluded (see `include` above).
    exclude: ['tests/e2e/**/*.spec.ts', 'node_modules/**', '.*/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
