import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, h, nextTick, ref, toValue } from 'vue';
import { usePreferredReducedMotion } from '@vueuse/core';
import { useSortable } from '@dnd-kit/vue/sortable';
import ReorderSurface from './ReorderSurface.vue';
import { REORDER_TRANSITION } from './reorderConfig';
import { ReorderTestItem } from './ReorderSurface.testUtils';

const preferredMotion = ref<'no-preference' | 'reduce'>('no-preference');

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    usePreferredReducedMotion: vi.fn(() => preferredMotion),
  };
});

// `useReorderItem` calls the real `useSortable`, which requires an active `DragDropProvider`
// manager context this suite does not set up. Stubbing it isolates the one contract under test —
// which `transition` value each item passes through — from dnd-kit's own sortable machinery,
// already covered by `ReorderSurface.test.ts` and `useReorderItem.test.ts`.
const capturedTransitions: unknown[] = [];

vi.mock('@dnd-kit/vue/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/vue/sortable')>();
  return {
    ...actual,
    useSortable: vi.fn((input: { transition?: unknown }) => {
      capturedTransitions.push(input.transition);
      return {
        sortable: computed(() => undefined),
        isDragging: computed(() => false),
        isDropping: computed(() => false),
        isDragSource: computed(() => false),
        isDropTarget: computed(() => false),
      };
    }),
  };
});

const mockedUsePreferredReducedMotion = vi.mocked(usePreferredReducedMotion);
const mockedUseSortable = vi.mocked(useSortable);

describe('ReorderSurface reorderTransition', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    preferredMotion.value = 'no-preference';
    capturedTransitions.length = 0;
    mockedUsePreferredReducedMotion.mockClear();
    mockedUseSortable.mockClear();
  });

  it('exposes REORDER_TRANSITION to items for no-preference', () => {
    const wrapper = mount(ReorderSurface, {
      attachTo: document.body,
      props: { itemIds: ['a', 'b'] },
      slots: {
        default: () => [
          h(ReorderTestItem, { key: 'a', id: 'a', index: 0 }),
          h(ReorderTestItem, { key: 'b', id: 'b', index: 1 }),
        ],
      },
    });

    expect(capturedTransitions).toHaveLength(2);
    for (const transition of capturedTransitions) {
      expect(toValue(transition)).toEqual(REORDER_TRANSITION);
    }

    wrapper.unmount();
  });

  it('exposes a disabled (null) transition to items for reduce', () => {
    preferredMotion.value = 'reduce';

    const wrapper = mount(ReorderSurface, {
      attachTo: document.body,
      props: { itemIds: ['a'] },
      slots: {
        default: () => [h(ReorderTestItem, { key: 'a', id: 'a', index: 0 })],
      },
    });

    expect(capturedTransitions).toHaveLength(1);
    expect(toValue(capturedTransitions[0])).toBeNull();

    wrapper.unmount();
  });

  it('updates the shared transition reactively when the preference changes', async () => {
    const wrapper = mount(ReorderSurface, {
      attachTo: document.body,
      props: { itemIds: ['a'] },
      slots: {
        default: () => [h(ReorderTestItem, { key: 'a', id: 'a', index: 0 })],
      },
    });

    const [transition] = capturedTransitions;
    expect(toValue(transition)).toEqual(REORDER_TRANSITION);

    preferredMotion.value = 'reduce';
    await nextTick();

    expect(toValue(transition)).toBeNull();

    preferredMotion.value = 'no-preference';
    await nextTick();

    expect(toValue(transition)).toEqual(REORDER_TRANSITION);

    wrapper.unmount();
  });

  it('resolves the preference once per surface, shared by every item, not once per item', () => {
    const wrapper = mount(ReorderSurface, {
      attachTo: document.body,
      props: { itemIds: ['a', 'b', 'c'] },
      slots: {
        default: () => [
          h(ReorderTestItem, { key: 'a', id: 'a', index: 0 }),
          h(ReorderTestItem, { key: 'b', id: 'b', index: 1 }),
          h(ReorderTestItem, { key: 'c', id: 'c', index: 2 }),
        ],
      },
    });

    expect(mockedUsePreferredReducedMotion).toHaveBeenCalledTimes(1);
    expect(capturedTransitions).toHaveLength(3);
    const [first, second, third] = capturedTransitions;
    expect(first).toBe(second);
    expect(second).toBe(third);

    wrapper.unmount();
  });
});
