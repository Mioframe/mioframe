import { defineConfig } from 'vitest/config';
import { getResolveAlias } from './config/alias';
import { getVuePlugin } from './config/plugins/base';
import { VITEST_TEST_INCLUDE, VITEST_TEST_EXCLUDE } from './scripts/lib/vitestTestPaths';

export default defineConfig({
  plugins: [getVuePlugin()],
  resolve: {
    alias: getResolveAlias(),
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/setupVitest.ts'],
    globals: true,
    include: [...VITEST_TEST_INCLUDE],
    // Playwright specs (always `.spec.ts`) must never run as vitest tests;
    // colocated `.test.mjs` fixture-logic tests under `tests/e2e/**` are
    // deliberately not excluded (see `include` above).
    exclude: [...VITEST_TEST_EXCLUDE],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
