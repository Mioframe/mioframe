import type { Plugin } from 'vite';
import type { PluginOption } from 'vite';
import type { Api } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import TurboConsole from 'unplugin-turbo-console/vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { isM3eCustomElement } from '../vueCustomElements';

/**
 * The Vue plugin shared by application, Storybook, and component-test
 * compilation. `@storybook/builder-vite` loads the root `vite.config.ts`
 * (which uses {@link getBaseVitePlugins}) as its base Vite config and does
 * not register its own `@vitejs/plugin-vue` instance, so this single
 * instance owns `m3e-*` custom-element recognition for both the application
 * and Storybook. `vitest.config.ts` reuses it directly for component tests.
 * @returns The configured `@vitejs/plugin-vue` instance.
 */
export const getVuePlugin = (): Plugin<Api> =>
  vue({ template: { compilerOptions: { isCustomElement: isM3eCustomElement } } });

export const getBaseVitePlugins = (): PluginOption[] => [
  wasm(),
  topLevelAwait(),
  getVuePlugin(),
  vueDevTools(),
  TurboConsole(),
];

export const getBaseWorkerPlugins = (): PluginOption[] => [
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- vite-plugin-wasm doesn't have types
  wasm() as PluginOption,
  topLevelAwait(),
  vue(),
  TurboConsole(),
];
