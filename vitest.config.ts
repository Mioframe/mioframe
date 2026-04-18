import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@feature': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@entity': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@widget': fileURLToPath(new URL('./src/widgets', import.meta.url)),
      '@page': fileURLToPath(new URL('./src/pages', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/setupVitest.ts'],
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.*/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
