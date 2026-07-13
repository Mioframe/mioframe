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

/** A controllable promise, used to resolve/reject a `persistOrder()` call deterministically. */
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

/**
 * @param result - The mounted composable's return value.
 * @returns The current ordered view names, in controlled display order.
 */
const namesOf = (result: ReturnType<typeof useDatabaseViewListReorder>): string[] =>
  result.orderedViewList.value.map(([, view]) => view.name);

/**
 * Simulates one completed, changed drag: activation, a single move, and a non-cancelled release.
 * The moved key is nominal — the composable's `onReorder` handler mutates purely by index — so
 * callers only need to reason about `fromIndex`/`toIndex`.
 * @param harness - The mounted composable's reorder harness.
 * @param fromIndex - The controlled index the drag starts from.
 * @param toIndex - The controlled index the drag ends at.
 */
const performDrag = async (
  harness: ReorderHarness,
  fromIndex: number,
  toIndex: number,
): Promise<void> => {
  harness.options.onDragStart?.({ key: FAKE_VIEW_ID_A, index: fromIndex });
  harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex, toIndex });
  harness.options.onDragEnd?.({
    key: FAKE_VIEW_ID_A,
    initialIndex: fromIndex,
    finalIndex: toIndex,
    cancelled: false,
  });
  await nextTick();
};

describe('useDatabaseViewListReorder', () => {
  describe('local controlled order', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('initial order follows entity views', () => {
      const { result } = mountReorder(views);

      expect(namesOf(result)).toEqual(['Alpha', 'Bravo']);
    });

    it('onReorder updates the local order synchronously without persisting', async () => {
      const { result, persistOrderMock } = mountReorder(views);
      const harness = getHarness();

      const moveEvent: ReorderMoveEvent<DatabaseViewId> = {
        key: FAKE_VIEW_ID_A,
        fromIndex: 0,
        toIndex: 1,
      };
      harness.options.onReorder(moveEvent);

      expect(persistOrderMock).not.toHaveBeenCalled();
      await nextTick();
      expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);
    });

    it('persists exactly once after a changed, non-cancelled drag', () => {
      const { persistOrderMock } = mountReorder(views);
      const harness = getHarness();

      harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex: 0, toIndex: 1 });

      const dragEndEvent: ReorderDragEndEvent<DatabaseViewId> = {
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 1,
        cancelled: false,
      };
      harness.options.onDragEnd?.(dragEndEvent);

      expect(persistOrderMock).toHaveBeenCalledTimes(1);
      expect(persistOrderMock).toHaveBeenCalledWith([FAKE_VIEW_ID_B, FAKE_VIEW_ID_A]);
    });

    it('does not persist a cancelled drag', () => {
      const { persistOrderMock } = mountReorder(views);
      const harness = getHarness();

      harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex: 0, toIndex: 1 });
      harness.options.onDragEnd?.({
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 1,
        cancelled: true,
      });

      expect(persistOrderMock).not.toHaveBeenCalled();
    });

    it('does not persist a completed drag that ends with the unchanged order', () => {
      const { persistOrderMock } = mountReorder(views);
      const harness = getHarness();

      harness.options.onDragEnd?.({
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 0,
        cancelled: false,
      });

      expect(persistOrderMock).not.toHaveBeenCalled();
    });
  });

  describe('promise and confirmation sequencing', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('does not start the queued write once the active write promise resolves without entity confirmation', async () => {
      const firstWrite = createDeferred<unknown>();
      const { persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();

      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });

    it('does not start the queued write once the entity confirms without the promise resolving', async () => {
      const firstWrite = createDeferred<unknown>();
      const { viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await nextTick();

      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });

    it('starts the queued write only once both the promise has resolved and the entity has settled', async () => {
      const firstWrite = createDeferred<unknown>();
      const { viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await nextTick();
      expect(persistOrderMock).toHaveBeenCalledTimes(1);

      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(persistOrderMock).toHaveBeenCalledTimes(2);
      });
      expect(persistOrderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('never has more than one persistOrder() promise in flight at a time', async () => {
      const firstWrite = createDeferred<unknown>();
      const { persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, does not start a second promise
      await performDrag(harness, 0, 1); // A,B -> B,A: replaces the queued order, still no second promise

      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('latest-intent replacement', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('a newest completed drag equal to the active write replaces a differing queued order, finishing at the newest intent with no redundant write', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 active, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]
      await performDrag(harness, 0, 1); // A,B -> B,A: newest intent equals the active target [B,A];
      // it must still replace the differing queued [A,B], not be treated as a no-op.

      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);
      });

      // The queued order is now [B,A], identical to the just-confirmed entity order, so no
      // redundant second write is issued.
      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });

    it('retains only the final not-yet-started order across three rapid completed drags', async () => {
      const firstWrite = createDeferred<unknown>();
      const { viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]
      await performDrag(harness, 0, 1); // A,B -> B,A: replaces the queued order with [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: replaces it again with [A,B]

      expect(persistOrderMock).toHaveBeenCalledTimes(1);

      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(persistOrderMock).toHaveBeenCalledTimes(2);
      });
      expect(persistOrderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('does not let equality with the active request preserve an older, different queued order', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 active, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]
      await performDrag(harness, 0, 1); // A,B -> B,A: newest intent [B,A] must replace the queued [A,B]

      // Rejecting write #1 reveals which order was actually queued: the entity's own order is
      // still [A,B], so a queued [A,B] would be dropped without a write, while a correctly
      // replaced queued [B,A] is started instead.
      firstWrite.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(persistOrderMock).toHaveBeenCalledTimes(2);
      });
      expect(persistOrderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_B, FAKE_VIEW_ID_A]);
      expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);
    });
  });

  describe('rejection', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    const viewsWithThree: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
      [FAKE_VIEW_ID_C, fakeView('Charlie')],
    ];

    it('rejection with no queued intent restores the latest entity order', async () => {
      const write = createDeferred<unknown>();
      const { result, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(write.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A
      expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);

      write.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(namesOf(result)).toEqual(['Alpha', 'Bravo']);
      });
    });

    it('rejection with a newer, differing queued intent starts that intent', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, persistOrderMock } = mountReorder(viewsWithThree);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1, target [B,A,C]
      await performDrag(harness, 2, 0); // B,A,C -> C,B,A: queued, target [C,B,A], distinct from
      // both the active target and the entity's own [A,B,C] order.

      firstWrite.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(persistOrderMock).toHaveBeenCalledTimes(2);
      });
      expect(persistOrderMock).toHaveBeenNthCalledWith(2, [
        FAKE_VIEW_ID_C,
        FAKE_VIEW_ID_B,
        FAKE_VIEW_ID_A,
      ]);
      expect(namesOf(result)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('rejection with a queued intent equal to the current entity order drops the queue without writing', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B], equal to the entity order

      firstWrite.reject(new Error('write failed'));
      await firstWrite.promise.catch(() => {});
      await nextTick();

      expect(persistOrderMock).toHaveBeenCalledTimes(1);
      expect(namesOf(result)).toEqual(['Alpha', 'Bravo']);
    });

    it('a fully confirmed earlier write does not prevent a later write from rolling back on rejection', async () => {
      const firstWrite = createDeferred<unknown>();
      const secondWrite = createDeferred<unknown>();
      const { result, viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      // Write #1 is settled by both its promise and a matching entity order, so it is fully
      // confirmed and cleared before write #2 starts.
      await performDrag(harness, 0, 1); // A,B -> B,A
      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();
      expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);

      persistOrderMock.mockReturnValueOnce(secondWrite.promise);
      await performDrag(harness, 0, 1); // Bravo,Alpha -> Alpha,Bravo: write #2
      expect(persistOrderMock).toHaveBeenCalledTimes(2);

      secondWrite.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);
      });
    });
  });

  describe('external changes', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    const viewsWithThree: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
      [FAKE_VIEW_ID_C, fakeView('Charlie')],
    ];

    it('an entity order matching no active local write is authoritative and replaces the optimistic display immediately', async () => {
      const { result, viewsRef } = mountReorder(views);

      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo (renamed)')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await nextTick();

      expect(namesOf(result)).toEqual(['Bravo (renamed)', 'Alpha']);
    });

    it('applies a competing external order immediately, replacing an unstarted queued local order, as the corrective target while the active write can still land later', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, viewsRef, persistOrderMock } = mountReorder(viewsWithThree);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1 active, target [B,A,C]
      await performDrag(harness, 0, 1); // B,A,C -> A,B,C: queued, target [A,B,C]

      // A competing external order (a third permutation, distinct from both write #1's target
      // and the queued order) arrives while write #1 is still active.
      viewsRef.value = [
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick();

      // The external order applies immediately, replacing the queued local order; write #1 has
      // not been asked to persist it yet.
      expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);
      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });

    it('does not let a later literal confirmation of the stale active target override the externally authoritative display, and re-asserts the corrective order once the write settles', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, viewsRef, persistOrderMock } = mountReorder(viewsWithThree);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1 active, target [B,A,C]
      await performDrag(harness, 0, 1); // B,A,C -> A,B,C: queued, target [A,B,C]

      viewsRef.value = [
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick(); // external order [C,A,B] applies; queued corrective target [C,A,B]

      // The entity later, briefly reports write #1's own (now-superseded) requested order [B,A,C];
      // the externally authoritative corrective display must not revert to it.
      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
      ];
      await nextTick();
      expect(namesOf(result)).toEqual(['Charlie', 'Alpha', 'Bravo']);

      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(persistOrderMock).toHaveBeenCalledTimes(2);
      });

      // The entity's last-observed order ([B,A,C]) still differs from the corrective target
      // ([C,A,B]), so the corrective write is issued once write #1 settles.
      expect(persistOrderMock).toHaveBeenNthCalledWith(2, [
        FAKE_VIEW_ID_C,
        FAKE_VIEW_ID_A,
        FAKE_VIEW_ID_B,
      ]);
    });

    it('does not issue a redundant corrective write once the entity already equals the corrective order when the active write settles', async () => {
      const firstWrite = createDeferred<unknown>();
      const { viewsRef, persistOrderMock } = mountReorder(viewsWithThree);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1 active, target [B,A,C]

      viewsRef.value = [
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick(); // external order [C,A,B] applies and remains the last-observed order

      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();

      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('entity emissions', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('a content-equal entity emission does not reset the live or optimistic order', async () => {
      const { result, viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 pending, entity still reports A,B

      // An unrelated document write re-emits the same ids in the same order as a new array.
      viewsRef.value = [...views];
      await nextTick();

      expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);
      expect(persistOrderMock).toHaveBeenCalledTimes(1);
    });

    it('a view data change with unchanged ids does not reset the controlled order', async () => {
      const { result, viewsRef } = mountReorder(views);

      viewsRef.value = [
        [FAKE_VIEW_ID_A, fakeView('Alpha (renamed)')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick();

      expect(namesOf(result)).toEqual(['Alpha (renamed)', 'Bravo']);
    });

    it('the latest confirmed order clears the outstanding request and optimistic state', async () => {
      const firstWrite = createDeferred<unknown>();
      const { result, viewsRef, persistOrderMock } = mountReorder(views);
      const harness = getHarness();
      persistOrderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      expect(persistOrderMock).toHaveBeenCalledTimes(1);

      viewsRef.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();

      expect(namesOf(result)).toEqual(['Bravo', 'Alpha']);

      // The cleared request must not block a later drag back to this same order.
      await performDrag(harness, 0, 1); // Bravo,Alpha -> Alpha,Bravo
      expect(persistOrderMock).toHaveBeenCalledTimes(2);
    });
  });
});
