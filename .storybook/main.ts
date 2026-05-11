import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import { getResolveAlias } from '../config/alias';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mjs|vue)'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      builder: {
        viteConfigPath: '.storybook/vite.config.ts',
      },
      docgen: {
        plugin: 'vue-component-meta',
        tsconfig: 'tsconfig.app.json',
      },
    },
  },
  viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: getResolveAlias(),
      },
      define: {
        __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      },
    });
  },
};

export default config;
