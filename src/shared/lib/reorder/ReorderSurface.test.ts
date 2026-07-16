import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, inject, reactive } from 'vue';
import { DragDropProvider } from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import ReorderSurface from './ReorderSurface.vue';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';
import { ReorderTestItem } from './ReorderSurface.testUtils';
import { REORDER_SURFACE_DUPLICATE_ITEM_IDS_MESSAGE } from './validateReorderSurface';

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

const fakeSortableSource = (element: Element, id: string, initialIndex: number, index: number) => ({
  element,
  id,
  initialIndex,
  index,
});

const dispatchDragStart = (wrapper: VueWrapper) => {
  wrapper.findComponent(DragDropProvider).vm.$emit('dragStart', {
    cancelable: false,
    operation: { source: null, target: null },
  });
};

const dispatchBeforeDragStart = (wrapper: VueWrapper) => {
  const preventDefault = vi.fn();
  wrapper.findComponent(DragDropProvider).vm.$emit('beforeDragStart', {
    cancelable: true,
    defaultPrevented: false,
    preventDefault,
    operation: { source: null, target: null },
  });
  return preventDefault;
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

// Mounts `ReorderSurface` behind a reactive array owned by the test, so a later in-place
// mutation (e.g. `itemIds[i] = ...`) reaches the surface exactly as a real consumer's mutation
// would, without remounting or replacing the array reference.
const mountReactiveSurface = (initialItemIds: string[]) => {
  const itemIds = reactive([...initialItemIds]);
  const wrapper = mount(ReorderSurface, {
    attachTo: document.body,
    props: { itemIds },
    slots: {
      default: () =>
        itemIds.map((id, index) =>
          h(ReorderTestItem, { key: `${id}-${String(index)}`, id, index }),
        ),
    },
  });
  return { wrapper, itemIds };
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
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2) });

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
      source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2),
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a no-op drag', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 0) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a negative fromIndex', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: fakeSortableSource(wrapper.get('li').element, 'a', -1, 1),
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a negative toIndex', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: fakeSortableSource(wrapper.get('li').element, 'b', 1, -1),
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a fromIndex at or beyond the snapshot length', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: fakeSortableSource(wrapper.get('li').element, 'a', 3, 1),
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing for a toIndex at or beyond the snapshot length', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: fakeSortableSource(wrapper.get('li').element, 'b', 1, 3),
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits normally for a valid drag after a canceled drag', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      canceled: true,
      source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2),
    });

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(1);
    expect(wrapper.emitted('reorder')?.[0]?.[0]).toEqual({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });

  it('emits normally for a valid drag after an out-of-range drag', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: fakeSortableSource(wrapper.get('li').element, 'a', 5, 1),
    });

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(1);
    expect(wrapper.emitted('reorder')?.[0]?.[0]).toEqual({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });

  it('emits nothing for a non-sortable drag source', () => {
    mockedIsSortableOperation.mockReturnValue(false);
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('reaches the disabled state to sortable items through the surface context', () => {
    const wrapper = mountSurface(['a'], true);

    expect(wrapper.get('[data-testid="disabled-probe"]').text()).toBe('true');
  });

  it('resets drag state deterministically so a later drag can emit again', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 1) });

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'b', 1, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(2);
  });

  it('throws a deterministic error for duplicate initial itemIds', () => {
    // Vue logs a "missing template or render function" dev warning once setup() throws before
    // returning its render function; that is expected noise for this contract, not a regression.
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => mountSurface(['a', 'b', 'a'])).toThrow(REORDER_SURFACE_DUPLICATE_ITEM_IDS_MESSAGE);
  });

  it('cancels an in-place duplicate mutation before drag start, without emitting', () => {
    const { wrapper, itemIds } = mountReactiveSurface(['a', 'b', 'c']);
    const element = wrapper.get('li').element;

    itemIds[2] = 'a';

    const preventDefault = dispatchBeforeDragStart(wrapper);

    expect(preventDefault).toHaveBeenCalledOnce();

    // dnd-kit does not emit dragStart after cancellation. A later stray dragEnd therefore has no
    // captured snapshot from this rejected activation and must resolve to nothing.
    dispatchDragEnd(wrapper, { source: fakeSortableSource(element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('resumes normal operation once the reactive list is corrected after rejected activation', () => {
    const { wrapper, itemIds } = mountReactiveSurface(['a', 'b', 'c']);
    const element = wrapper.get('li').element;

    itemIds[2] = 'a';
    expect(dispatchBeforeDragStart(wrapper)).toHaveBeenCalledOnce();

    itemIds[2] = 'c';

    expect(dispatchBeforeDragStart(wrapper)).not.toHaveBeenCalled();
    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(1);
    expect(wrapper.emitted('reorder')?.[0]?.[0]).toEqual({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });

  it('ignores a drag completion that arrives after the controlled list became a duplicate', () => {
    const { wrapper, itemIds } = mountReactiveSurface(['a', 'b', 'c']);
    const element = wrapper.get('li').element;

    dispatchDragStart(wrapper);
    itemIds[2] = 'a';
    dispatchDragEnd(wrapper, { source: fakeSortableSource(element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toBeUndefined();

    // Restoring a valid, unique order lets a later drag emit normally again, without remounting.
    itemIds[2] = 'c';

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(1);
    expect(wrapper.emitted('reorder')?.[0]?.[0]).toEqual({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });

  it('emits nothing when the controlled itemIds changed during an active drag', async () => {
    const wrapper = mountSurface(['a', 'b', 'c']);
    const element = wrapper.get('li').element;

    dispatchDragStart(wrapper);
    await wrapper.setProps({ itemIds: ['c', 'a', 'b'] });
    dispatchDragEnd(wrapper, { source: fakeSortableSource(element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing when the active id was removed from itemIds during an active drag', async () => {
    const wrapper = mountSurface(['a', 'b', 'c']);
    const element = wrapper.get('li').element;

    dispatchDragStart(wrapper);
    await wrapper.setProps({ itemIds: ['b', 'c'] });
    dispatchDragEnd(wrapper, { source: fakeSortableSource(element, 'a', 0, 1) });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits nothing when source.id does not match the snapshot at initialIndex', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: { element: wrapper.get('li').element, id: 'z', initialIndex: 0, index: 2 },
    });

    expect(wrapper.emitted('reorder')).toBeUndefined();
  });

  it('emits normally for a valid drag after an ignored identity-inconsistent operation', () => {
    const wrapper = mountSurface(['a', 'b', 'c']);

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, {
      source: { element: wrapper.get('li').element, id: 'z', initialIndex: 0, index: 2 },
    });

    dispatchDragStart(wrapper);
    dispatchDragEnd(wrapper, { source: fakeSortableSource(wrapper.get('li').element, 'a', 0, 2) });

    expect(wrapper.emitted('reorder')).toHaveLength(1);
    expect(wrapper.emitted('reorder')?.[0]?.[0]).toEqual({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });
});
