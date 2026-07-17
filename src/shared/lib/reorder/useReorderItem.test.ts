import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, useTemplateRef } from 'vue';
import { useReorderItem } from './useReorderItem';

const StandaloneItem = defineComponent({
  setup() {
    const elRef = useTemplateRef<HTMLLIElement>('el');

    useReorderItem({
      id: () => 'a',
      index: () => 0,
      element: () => elRef.value ?? undefined,
      handle: () => elRef.value ?? undefined,
    });

    return () => h('li', { ref: 'el' }, 'a');
  },
});

describe('useReorderItem', () => {
  it('throws clearly when used outside a ReorderSurface', () => {
    // Vue logs a "missing template or render function" dev warning once setup() throws before
    // returning its render function; that is expected noise for this contract, not a regression.
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => mount(StandaloneItem)).toThrow(
      'useReorderItem must be used within a ReorderSurface',
    );
  });
});
