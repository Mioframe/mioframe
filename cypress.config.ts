import { defineConfig } from 'cypress';
import vitePreprocessor from 'cypress-vite';

export default defineConfig({
  e2e: {
    baseUrl: 'https://localhost:4173/',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('file:preprocessor', vitePreprocessor(config));
    },
  },
});
