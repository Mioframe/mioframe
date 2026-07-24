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
      'playwright.*.test.ts',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**', '.*/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
