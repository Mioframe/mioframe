import type { PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import TurboConsole from 'unplugin-turbo-console/vite';
import vueDevTools from 'vite-plugin-vue-devtools';

export const getBaseVitePlugins = (): PluginOption[] => [
  wasm(),
  topLevelAwait(),
  vue(),
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
