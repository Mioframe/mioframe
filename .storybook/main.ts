import type { StorybookConfig } from '@storybook/vue3-vite';
import { fileURLToPath, URL } from 'node:url';
import { mergeConfig } from 'vite';
import { getResolveAlias } from '../config/alias.ts';

const storybookIconStateStub = fileURLToPath(
  new URL('./stubs/useMaterialDesignSymbols.ts', import.meta.url),
);
const baseAliases = getResolveAlias();

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mjs|vue)'],
  // Storybook 10 includes controls/actions/docs and viewport in the framework preset.
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: {
        plugin: 'vue-component-meta',
        tsconfig: 'tsconfig.app.json',
      },
    },
  },
  viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: [
          // Storybook-only icon stub keeps visual snapshots deterministic by avoiding loader side effects.
          {
            find: './useMaterialDesignSymbols',
            replacement: storybookIconStateStub,
          },
          {
            find: /(^|\/)src\/shared\/ui\/Icon\/useMaterialDesignSymbols(?:\.ts)?$/,
            replacement: storybookIconStateStub,
          },
          ...Object.entries(baseAliases).map(([find, replacement]) => ({
            find,
            replacement,
          })),
        ],
      },
      define: {
        __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      },
    });
  },
};

export default config;
