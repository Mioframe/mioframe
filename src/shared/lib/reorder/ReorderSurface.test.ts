import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, inject } from 'vue';
import { DragDropProvider } from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import ReorderSurface from './ReorderSurface.vue';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';
import { ReorderTestItem } from './ReorderSurface.testUtils';

vi.mock('@dnd-kit/vue/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/vue/sortable')>();
  return {
    ...actual,
    isSortableOperation: vi.fn(),
  };
});

const mockedIsSortableOperation = vi.mocked(isSortableOperation);

const DisabledProbe = defineComponent({
  setup() {
    const surface = inject(reorderSurfaceInjectionKey);

    return () => h('span', { 'data-testid': 'disabled-probe' }, String(surface?.disabled.value));
  },
});

const mountSurface = (itemIds: string[], disabled = false) =>
  mount(ReorderSurface, {
    attachTo: document.body,
    props: { itemIds, disabled },
    slots: {
      default: () => [
        ...itemIds.map((id, index) => h(ReorderTestItem, { key: id, id, index })),
        h(DisabledProbe),
      ],
    },
  });

const fakeSortableSource = (element: Element, initialIndex: number, index: number) => ({
  element,
  initialIndex,
  index,
});

const dispatchDragStart = (wrapper: VueWrapper) => {
  wrapper.findComponent(DragDropProvider).vm.$emit('dragStart', {
    cancelable: false,
    operation: { source: null, target: null },
  });
};

const dispatchDragEnd = (
  wrapper: VueWrapper,
  options: { canceled?: boolean; source?: unknown } = {},
) => {
  wrapper.findComponent(DragDropProvider).vm.$emit('dragEnd', {
    operation: { source: options.source ?? null, target: null },
    canceled: options.canceled ?? false,
    suspend: () => ({ resume: () => undefined, abort: () => undefined }),
  });
};

describe('ReorderSurface', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockedIsSortableOperation.mockReset();
    mockedIsSortableOperation.mockImplementation(
      (operation: { source?: unknown }) => operation.source != null,
    );
  });

  it('adds no DOM wrapper around slot content', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    expect(wrapper.findAll('li')).toHaveLength(3);
    expect(wrapper.html()).not.toContain('<div');
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

  it('emits a typed reorder payload for a valid changed drag', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 0, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(1);
    expect(wrapper.emitted('reorder')?.[0]?.[0]).toEqual({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });

  it('emits nothing for a canceled drag', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      canceled: true,
      source: fakeSortableSource(wrapper.get('li').element, 0, 2),
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a no-op drag', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 0, 0) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a non-sortable drag source', () => {
    mockedIsSortableOperation.mockReturnValue(false);
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 0, 2) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('reaches the disabled state to sortable items through the surface context', () => {
    const wrapper = mountSurface(['a'], true);

    expect(wrapper.get('[data-testid="disabled-probe"]').text()).toBe('true');
  });

  it('resets drag state deterministically so a later drag can emit again', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 0, 1) });

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 1, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(2);
  });
});
