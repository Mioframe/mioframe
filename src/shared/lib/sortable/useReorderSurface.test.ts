import { effectScope, nextTick, ref, type EffectScope, type Ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReorderEngineCallbacks } from './reorderTypes';

interface MockSortableAdapterState {
  callbacks: ReorderEngineCallbacks | undefined;
  cancel: ReturnType<typeof vi.fn>;
}

const sortableAdapterState = vi.hoisted<MockSortableAdapterState>(() => ({
  callbacks: undefined,
  cancel: vi.fn(),
}));

vi.mock('./sortableAdapter', () => ({
  createSortableAdapter: (
    _container: unknown,
    { callbacks }: { callbacks?: ReorderEngineCallbacks },
  ) => {
    sortableAdapterState.callbacks = callbacks;
    sortableAdapterState.cancel = vi.fn();

    return {
      sortable: undefined,
      destroy: vi.fn(),
      sort: vi.fn(),
      toArray: () => [],
      cancel: sortableAdapterState.cancel,
    };
  },
}));

import { useReorderSurface } from './useReorderSurface';

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

const cleanupList: EffectScope[] = [];

const mountUseReorderSurface = ({
  itemIdList,
  onCommit = vi.fn().mockResolvedValue(undefined),
}: {
  itemIdList: Ref<string[] | undefined>;
  onCommit?: (payload: unknown) => unknown;
}) => {
  const scope = effectScope();
  const containerEl = document.createElement('div');

  document.body.appendChild(containerEl);
  cleanupList.push(scope);

  const container = ref(containerEl);

  const api = scope.run(() =>
    useReorderSurface(container, {
      itemIdList,
      onCommit,
    }),
  );

  if (!api) {
    throw new Error('Failed to mount reorder surface');
  }

  return {
    api,
    onCommit,
    containerEl,
  };
};

afterEach(() => {
  cleanupList.splice(0).forEach((scope) => {
    scope.stop();
  });
  document.body.innerHTML = '';
  sortableAdapterState.callbacks = undefined;
  vi.clearAllMocks();
});

describe('useReorderSurface', () => {
  it('rolls back to the latest external list when the item set changes mid-drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, onCommit } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    await nextTick();

    itemIdList.value = ['b', 'c', 'd'];

    await nextTick();
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'c', 'd']);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('accepts an external reorder of the same ids while an optimistic commit is pending', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const commit = createDeferred<undefined>();
    const onCommit = vi.fn(() => commit.promise);
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    const endPromise = sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'a', 'c']);

    itemIdList.value = ['c', 'a', 'b'];

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['c', 'a', 'b']);

    commit.reject(new Error('conflict'));

    await endPromise;
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['c', 'a', 'b']);
  });
});
