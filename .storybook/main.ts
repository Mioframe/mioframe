import type { StorybookConfig } from '@storybook/vue3-vite';
import { fileURLToPath, URL } from 'node:url';
import { mergeConfig } from 'vite';
import { getResolveAlias } from '../config/alias.ts';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

const storybookIconStateStub = fileURLToPath(
  new URL('./stubs/useMaterialDesignSymbols.ts', import.meta.url),
);
const baseAliases = Object.entries(getResolveAlias());

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mjs|vue)'],
  // Storybook 10 includes controls/actions/docs and viewport in the framework preset.
  addons: ['@storybook/addon-a11y'],
  core: {
    disableTelemetry: true,
  },
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: {
        plugin: 'vue-component-meta',
        tsconfig: 'tsconfig.storybook.json',
      },
    },
  },
  viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: [
          // Storybook-only icon stub keeps visual snapshots deterministic by avoiding loader side effects.
          {
            find: '@shared/ui/Icon/useMaterialDesignSymbols',
            replacement: storybookIconStateStub,
          },
          ...baseAliases.map(([find, replacement]) => ({
            find,
            replacement,
          })),
        ],
      },
      define: {
        __BUILD_DATE__: JSON.stringify(toolingConfig.storybook.deterministicBuildDate),
      },
    });
  },
};

export default config;
