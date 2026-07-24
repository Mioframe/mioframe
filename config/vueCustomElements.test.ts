import { compileTemplate } from 'vue/compiler-sfc';
import { describe, expect, it } from 'vitest';
import { isM3eCustomElement } from './vueCustomElements.ts';

describe('isM3eCustomElement', () => {
  it('matches tags in the m3e- namespace', () => {
    expect(isM3eCustomElement('m3e-button')).toBe(true);
    expect(isM3eCustomElement('m3e-icon-button')).toBe(true);
    expect(isM3eCustomElement('m3e-')).toBe(true);
  });

  it('does not match unrelated tags', () => {
    expect(isM3eCustomElement('div')).toBe(false);
    expect(isM3eCustomElement('button')).toBe(false);
    expect(isM3eCustomElement('MDButton')).toBe(false);
    expect(isM3eCustomElement('m3-button')).toBe(false);
    expect(isM3eCustomElement('')).toBe(false);
  });
});

const compile = (source: string, isCustomElement?: (tag: string) => boolean) =>
  compileTemplate({
    source,
    filename: 'CustomElementRecognition.vue',
    id: 'custom-element-recognition',
    ...(isCustomElement ? { compilerOptions: { isCustomElement } } : {}),
  });

describe('isM3eCustomElement Vue template compilation', () => {
  it('compiles m3e-* tags as native custom elements, not resolved Vue components', () => {
    const { code, errors } = compile('<m3e-button>Click</m3e-button>', isM3eCustomElement);

    expect(errors).toHaveLength(0);
    expect(code).not.toContain('resolveComponent("m3e-button")');
    expect(code).toContain('m3e-button');
  });

  it('still resolves ordinary unknown component tags as Vue components', () => {
    const { code, errors } = compile('<SomeUnknownComponent />', isM3eCustomElement);

    expect(errors).toHaveLength(0);
    expect(code).toContain('resolveComponent("SomeUnknownComponent")');
  });

  it('without the predicate, an m3e-* tag would otherwise be resolved as a Vue component', () => {
    const { code } = compile('<m3e-button>Click</m3e-button>');

    expect(code).toContain('resolveComponent("m3e-button")');
  });
});
