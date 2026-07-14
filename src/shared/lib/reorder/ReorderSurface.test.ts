import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, useTemplateRef } from 'vue';
import ReorderSurface from './ReorderSurface.vue';
import { useReorderItem } from './useReorderItem';

const TestItem = defineComponent({
  props: {
    id: { type: String, required: true },
    index: { type: Number, required: true },
  },
  setup(props) {
    const elRef = useTemplateRef<HTMLLIElement>('el');

    useReorderItem({
      id: () => props.id,
      index: () => props.index,
      element: () => elRef.value ?? undefined,
      handle: () => elRef.value ?? undefined,
    });

    return () => h('li', { ref: 'el' }, props.id);
  },
});

const mountSurface = (itemIds: string[], commit = vi.fn().mockResolvedValue('applied' as const)) =>
  mount(ReorderSurface, {
    attachTo: document.body,
    props: { itemIds, commit },
    slots: {
      default: (scope: { displayItemIds: readonly string[] }) =>
        scope.displayItemIds.map((id, index) => h(TestItem, { key: id, id, index })),
    },
  });

describe('ReorderSurface', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds no DOM wrapper around slot content', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    expect(wrapper.findAll('li')).toHaveLength(3);
    expect(wrapper.html()).not.toContain('<div');
  });

  it('passes the displayed ids to the default slot', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    expect(wrapper.findAll('li').map((row) => row.text())).toEqual(['a', 'b', 'c']);
  });

  it('does not advertise unsupported keyboard drag semantics on the item element', () => {
    const wrapper = mountSurface(['a', 'b']);
    const row = wrapper.get('li');

    expect(row.attributes('aria-roledescription')).toBeUndefined();
    expect(row.attributes('aria-grabbed')).toBeUndefined();
    expect(row.attributes('aria-pressed')).toBeUndefined();
    expect(row.attributes('aria-describedby')).toBeUndefined();
    expect(row.attributes('role')).not.toBe('button');
  });
});
