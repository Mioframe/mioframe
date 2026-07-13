import {
  DB_VIEW_LAYOUT,
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { ReorderDragEndEvent, ReorderMoveEvent, UseReorderOptions } from '@shared/lib/reorder';
import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type Ref } from 'vue';
import { useDatabaseViewListReorder } from './useDatabaseViewListReorder';

const FAKE_VIEW_ID_A = generateViewId();
const FAKE_VIEW_ID_B = generateViewId();
const FAKE_VIEW_ID_C = generateViewId();
const FAKE_VIEW_ID_D = generateViewId();

const fakeView = (name: string): DatabaseView => ({ name, layout: DB_VIEW_LAYOUT.TABLE });

interface ReorderHarness {
  options: UseReorderOptions<DatabaseViewId>;
  draggingKey: Ref<DatabaseViewId | null>;
}

let lastReorderHarness: ReorderHarness | undefined;

vi.mock('@shared/lib/reorder', () => ({
  useReorder: (options: UseReorderOptions<DatabaseViewId>) => {
    const draggingKey = ref<DatabaseViewId | null>(null);
    lastReorderHarness = { options, draggingKey };

    return {
      draggingKey,
      vReorderContainer: {},
      vReorderItem: {},
      vReorderActivator: {},
      vReorderIgnore: {},
    };
  },
}));

const getHarness = (): ReorderHarness => {
  if (!lastReorderHarness) throw new Error('useReorder was not called');
  return lastReorderHarness;
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const mountReorder = (views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]>) => {
  const scope = effectScope();
  const viewsRef = ref(views);
  const persistOrderMock = vi
    .fn<(orderedIds: DatabaseViewId[]) => Promise<unknown>>()
    .mockResolvedValue(undefined);
  lastReorderHarness = undefined;

  let result!: ReturnType<typeof useDatabaseViewListReorder>;

  scope.run(() => {
    result = useDatabaseViewListReorder({
      views: viewsRef,
      persistOrder: persistOrderMock,
    });
  });

  return { result, viewsRef, persistOrderMock, scope };
};

const namesOf = (result: ReturnType<typeof useDatabaseViewListReorder>): string[] =>
  result.orderedViewList.value.map(([, view]) => view.name);

const emitLiveOrder = async (
  harness: ReorderHarness,
  orderedKeys: readonly DatabaseViewId[],
): Promise<void> => {
  const event: ReorderMoveEvent<DatabaseViewId> = {
    key: orderedKeys[0] ?? FAKE_VIEW_ID_A,
    fromIndex: 0,
    toIndex: Math.max(orderedKeys.length - 1, 0),
    orderedKeys: [...orderedKeys],
  };
  harness.options.onReorder(event);
  await nextTick();
};

const endDrag = async (
  harness: ReorderHarness,
  {
    orderedKeys,
    changed,
    cancelled = false,
  }: {
    orderedKeys: readonly DatabaseViewId[];
    changed: boolean;
    cancelled?: boolean;
  },
): Promise<void> => {
  const event: ReorderDragEndEvent<DatabaseViewId> = {
    key: orderedKeys[0] ?? FAKE_VIEW_ID_A,
    initialIndex: 0,
    finalIndex: Math.max(orderedKeys.length - 1, 0),
    cancelled,
    changed: cancelled ? false : changed,
    orderedKeys: [...orderedKeys],
  };
  harness.options.onDragEnd?.(event);
  await nextTick();
};

const startDrag = (harness: ReorderHarness, key: DatabaseViewId = FAKE_VIEW_ID_A): void => {
  harness.options.onDragStart?.({ key, index: 0 });
};

const performCompletedDrag = async (
  harness: ReorderHarness,
  orderedKeys: readonly DatabaseViewId[],
): Promise<void> => {
  startDrag(harness, orderedKeys[0] ?? FAKE_VIEW_ID_A);
  await emitLiveOrder(harness, orderedKeys);
  await endDrag(harness, { orderedKeys, changed: true });
};

describe('useDatabaseViewListReorder', () => {
  const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
    [FAKE_VIEW_ID_A, fakeView('Alpha')],
    [FAKE_VIEW_ID_B, fakeView('Bravo')],
    [FAKE_VIEW_ID_C, fakeView('Charlie')],
  ];

  it('adopts orderedKeys from onReorder synchronously without persisting', async () => {
    const { result, persistOrderMock } = mountReorder(views);
    const harness = getHarness();

    await emitLiveOrder(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);
    expect(persistOrderMock).not.toHaveBeenCalled();
  });

  it('persists immediately on a changed completed drag and skips cancelled or unchanged drags', async () => {
    const { persistOrderMock } = mountReorder(views);
    const harness = getHarness();

    startDrag(harness, FAKE_VIEW_ID_C);
    await emitLiveOrder(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    await endDrag(harness, {
      orderedKeys: [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B],
      changed: true,
    });
    await endDrag(harness, {
      orderedKeys: [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B, FAKE_VIEW_ID_C],
      changed: false,
    });
    await endDrag(harness, {
      orderedKeys: [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B, FAKE_VIEW_ID_C],
      changed: false,
      cancelled: true,
    });

    expect(persistOrderMock).toHaveBeenCalledTimes(1);
    expect(persistOrderMock).toHaveBeenCalledWith([FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
  });

  it('submits two rapid completed drags immediately without feature-local serialization', async () => {
    const firstWrite = createDeferred<unknown>();
    const secondWrite = createDeferred<unknown>();
    const { persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock
      .mockReturnValueOnce(firstWrite.promise)
      .mockReturnValueOnce(secondWrite.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    await performCompletedDrag(harness, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_C, FAKE_VIEW_ID_B]);

    expect(persistOrderMock).toHaveBeenCalledTimes(2);
    expect(persistOrderMock).toHaveBeenNthCalledWith(1, [
      FAKE_VIEW_ID_C,
      FAKE_VIEW_ID_A,
      FAKE_VIEW_ID_B,
    ]);
    expect(persistOrderMock).toHaveBeenNthCalledWith(2, [
      FAKE_VIEW_ID_A,
      FAKE_VIEW_ID_C,
      FAKE_VIEW_ID_B,
    ]);
  });

  it('an older rejection does not roll back a newer latest intent', async () => {
    const firstWrite = createDeferred<unknown>();
    const secondWrite = createDeferred<unknown>();
    const { result, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock
      .mockReturnValueOnce(firstWrite.promise)
      .mockReturnValueOnce(secondWrite.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    await performCompletedDrag(harness, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_C, FAKE_VIEW_ID_B]);

    firstWrite.reject(new Error('stale write failed'));
    await firstWrite.promise.catch(() => {});
    await nextTick();

    expect(namesOf(result)).toEqual(['Alpha', 'Charlie', 'Bravo']);
    expect(persistOrderMock).toHaveBeenCalledTimes(2);

    secondWrite.resolve(undefined);
    await secondWrite.promise;
  });

  it('an older canonical confirmation during a newer active drag does not overwrite the live order', async () => {
    const firstWrite = createDeferred<unknown>();
    const { result, viewsRef, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(firstWrite.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);

    startDrag(harness, FAKE_VIEW_ID_A);
    await emitLiveOrder(harness, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_C, FAKE_VIEW_ID_B]);

    viewsRef.value = [
      [FAKE_VIEW_ID_C, fakeView('Charlie')],
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];
    await nextTick();

    expect(namesOf(result)).toEqual(['Alpha', 'Charlie', 'Bravo']);
  });

  it('clears the latest optimistic state only after both promise resolution and entity confirmation', async () => {
    const write = createDeferred<unknown>();
    const { result, viewsRef, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    write.resolve(undefined);
    await write.promise;
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);

    viewsRef.value = [
      [FAKE_VIEW_ID_C, fakeView('Charlie')],
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('also handles entity confirmation arriving before the latest promise resolves', async () => {
    const write = createDeferred<unknown>();
    const { result, viewsRef, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);

    viewsRef.value = [
      [FAKE_VIEW_ID_C, fakeView('Charlie')],
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);

    write.resolve(undefined);
    await write.promise;
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('latest rejection restores canonical order when no drag is active', async () => {
    const write = createDeferred<unknown>();
    const { result, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);

    write.reject(new Error('latest write failed'));
    await write.promise.catch(() => {});
    await nextTick();

    expect(namesOf(result)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('latest rejection during another active drag does not overwrite the live order', async () => {
    const write = createDeferred<unknown>();
    const { result, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    startDrag(harness, FAKE_VIEW_ID_A);
    await emitLiveOrder(harness, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_C, FAKE_VIEW_ID_B]);

    write.reject(new Error('latest write failed'));
    await write.promise.catch(() => {});
    await nextTick();

    expect(namesOf(result)).toEqual(['Alpha', 'Charlie', 'Bravo']);
  });

  it('content-equal entity emissions are inert while optimistic state is active', async () => {
    const write = createDeferred<unknown>();
    const { result, viewsRef, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);

    viewsRef.value = [...views];
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('normalizes structural entity membership changes against the live optimistic order', async () => {
    const write = createDeferred<unknown>();
    const { result, viewsRef, persistOrderMock } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);

    viewsRef.value = [
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
      [FAKE_VIEW_ID_C, fakeView('Charlie')],
      [FAKE_VIEW_ID_D, fakeView('Delta')],
    ];
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Bravo', 'Delta']);
  });

  it('scope.stop prevents post-dispose UI mutation while already submitted persistence survives', async () => {
    const write = createDeferred<unknown>();
    const { result, persistOrderMock, scope } = mountReorder(views);
    const harness = getHarness();
    persistOrderMock.mockReturnValueOnce(write.promise);

    await performCompletedDrag(harness, [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    expect(persistOrderMock).toHaveBeenCalledTimes(1);

    scope.stop();
    write.reject(new Error('disposed write failed'));
    await write.promise.catch(() => {});
    await nextTick();

    expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });
});
