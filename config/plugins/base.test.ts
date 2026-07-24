import { describe, expect, it } from 'vitest';
import { getBaseVitePlugins, getVuePlugin } from './base.ts';

// getVuePlugin() is the single shared m3e-* recognition owner, reused by:
// - vite.config.ts (application), via getBaseVitePlugins() below;
// - @storybook/builder-vite (Storybook), which loads the root vite.config.ts
//   as its base config instead of registering its own @vitejs/plugin-vue;
// - vitest.config.ts (component tests), which imports getVuePlugin() directly.
describe('getVuePlugin', () => {
  it('recognizes m3e-* tags as custom elements', () => {
    const isCustomElement = getVuePlugin().api?.options.template?.compilerOptions?.isCustomElement;

    expect(isCustomElement).toBeTypeOf('function');
    expect(isCustomElement?.('m3e-button')).toBe(true);
    expect(isCustomElement?.('m3e-icon-button')).toBe(true);
  });

  it('leaves ordinary elements and Vue components unaffected', () => {
    const isCustomElement = getVuePlugin().api?.options.template?.compilerOptions?.isCustomElement;

    expect(isCustomElement?.('div')).toBe(false);
    expect(isCustomElement?.('MDButton')).toBe(false);
  });
});

const isVuePlugin = (plugin: unknown): boolean =>
  !!plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'vite:vue';

describe('getBaseVitePlugins', () => {
  it('includes the shared m3e-aware Vue plugin', () => {
    const vuePlugin = getBaseVitePlugins().find(isVuePlugin);

    expect(vuePlugin).toBeDefined();
  });
});
