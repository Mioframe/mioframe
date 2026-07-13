import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { h, nextTick, ref, type Directive, type Ref } from 'vue';
import {
  DB_VIEW_LAYOUT,
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { ReorderDragEndEvent, ReorderMoveEvent, UseReorderOptions } from '@shared/lib/reorder';
import { MDListItem } from '@shared/ui/Lists';
import DatabaseViewListEdit from './DatabaseViewListEdit.vue';

const FAKE_VIEW_ID_A = generateViewId();
const FAKE_VIEW_ID_B = generateViewId();
const FAKE_VIEW_ID_C = generateViewId();
const FAKE_DOC_ID = new Repo().create({}).documentId;

const fakeView = (name: string): DatabaseView => ({ name, layout: DB_VIEW_LAYOUT.TABLE });

/**
 * Spy directive: records every `mounted` invocation's element so the wiring tests below can
 * assert which DOM element the component applied it to, without inspecting private `MDListItem`
 * internals.
 * @returns A directive object exposing the `mountedEls` it recorded.
 */
const createSpyDirective = (): Directive & { mountedEls: HTMLElement[] } => {
  const mountedEls: HTMLElement[] = [];
  return {
    mounted: (el: HTMLElement) => {
      mountedEls.push(el);
    },
    unmounted: () => {},
    mountedEls,
  };
};

interface ReorderHarness {
  options: UseReorderOptions<DatabaseViewId>;
  draggingKey: Ref<DatabaseViewId | null>;
  vReorderContainer: ReturnType<typeof createSpyDirective>;
  vReorderItem: ReturnType<typeof createSpyDirective>;
  vReorderActivator: ReturnType<typeof createSpyDirective>;
  vReorderIgnore: ReturnType<typeof createSpyDirective>;
}

let lastReorderHarness: ReorderHarness | undefined;
let currentViews: Ref<ReadonlyArray<readonly [DatabaseViewId, DatabaseView]>>;
let reorderMock: Mock<(orderedIds: DatabaseViewId[]) => Promise<unknown>>;

vi.mock('@entity/databaseView', () => ({
  useDatabaseViews: () => ({
    reorder: (orderedIds: DatabaseViewId[]) => reorderMock(orderedIds),
    views: currentViews,
  }),
}));

vi.mock('@shared/lib/reorder', () => ({
  useReorder: (options: UseReorderOptions<DatabaseViewId>) => {
    const draggingKey = ref<DatabaseViewId | null>(null);
    const harness: ReorderHarness = {
      options,
      draggingKey,
      vReorderContainer: createSpyDirective(),
      vReorderItem: createSpyDirective(),
      vReorderActivator: createSpyDirective(),
      vReorderIgnore: createSpyDirective(),
    };
    lastReorderHarness = harness;

    return {
      draggingKey,
      vReorderContainer: harness.vReorderContainer,
      vReorderItem: harness.vReorderItem,
      vReorderActivator: harness.vReorderActivator,
      vReorderIgnore: harness.vReorderIgnore,
    };
  },
}));

const mountEdit = (
  slots: Record<string, () => unknown> = {},
  props: Record<string, unknown> = {},
  views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
    [FAKE_VIEW_ID_A, fakeView('My View')],
  ],
) => {
  currentViews = ref(views);
  reorderMock = vi
    .fn<(orderedIds: DatabaseViewId[]) => Promise<unknown>>()
    .mockResolvedValue(undefined);
  lastReorderHarness = undefined;

  return mount(DatabaseViewListEdit, {
    attachTo: document.body,
    props: {
      directoryPath: '/db',
      documentId: FAKE_DOC_ID,
      ...props,
    },
    slots,
  });
};

const getHarness = (): ReorderHarness => {
  if (!lastReorderHarness) throw new Error('useReorder was not called');
  return lastReorderHarness;
};

/**
 * @param wrapper - A mounted `DatabaseViewListEdit` wrapper.
 * @returns The rendered rows' label text, in their current controlled order.
 */
const labelsOf = (wrapper: ReturnType<typeof mountEdit>): string[] =>
  wrapper.findAllComponents(MDListItem).map((item) => item.props('labelText'));

/** A controllable promise, used to resolve/reject a `reorder()` call deterministically. */
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

/**
 * Simulates one completed, changed drag: activation, a single move, and a non-cancelled release.
 * The moved key is nominal — the component's `onReorder` handler mutates purely by index — so
 * callers only need to reason about `fromIndex`/`toIndex`.
 * @param harness - The mounted component's reorder harness.
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

describe('DatabaseViewListEdit', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders single-action rows when no trailingAction slot is provided', () => {
    const wrapper = mountEdit();

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('renders multi-action rows when trailingAction slot is provided', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);

    const nestedInPrimary = wrapper
      .find('.md-list-item__primary-action')
      .find('[data-testid="trailing-btn"]');
    expect(nestedInPrimary.exists()).toBe(false);
  });

  it('does not nest trailing action inside the primary action surface', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    const primaryAction = wrapper.find('.md-list-item__primary-action');
    expect(primaryAction.exists()).toBe(true);
    expect(primaryAction.find('button[data-testid="trailing-btn"]').exists()).toBe(false);
  });

  it('exposes the current view accessibly via aria-current on the row', () => {
    const wrapper = mountEdit({}, { currentViewId: FAKE_VIEW_ID_A });

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBe('true');
  });

  it('does not set aria-current when the view is not the current one', () => {
    const wrapper = mountEdit();

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBeUndefined();
  });

  it('applies both vReorderItem and vReorderActivator to the same row element', () => {
    mountEdit();

    const harness = getHarness();
    expect(harness.vReorderItem.mountedEls).toHaveLength(1);
    expect(harness.vReorderActivator.mountedEls).toHaveLength(1);
    expect(harness.vReorderItem.mountedEls[0]).toBe(harness.vReorderActivator.mountedEls[0]);
  });

  it('wraps the trailing slot in an element carrying vReorderIgnore', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    const harness = getHarness();
    expect(harness.vReorderIgnore.mountedEls).toHaveLength(1);

    const ignoreEl = harness.vReorderIgnore.mountedEls[0];
    const trailingButton = wrapper.get('[data-testid="trailing-btn"]').element;
    expect(ignoreEl?.contains(trailingButton)).toBe(true);
  });

  it('drives MDListItem.dragged from the reorder library draggingKey', async () => {
    const wrapper = mountEdit();
    const harness = getHarness();

    expect(wrapper.findComponent(MDListItem).props('dragged')).toBe(false);

    harness.draggingKey.value = FAKE_VIEW_ID_A;
    await nextTick();

    expect(wrapper.findComponent(MDListItem).props('dragged')).toBe(true);
  });

  it('emits clickView on a primary row click', async () => {
    const wrapper = mountEdit();

    await wrapper.get('.md-list-item__primary-action').trigger('click');

    expect(wrapper.emitted('clickView')).toEqual([[FAKE_VIEW_ID_A]]);
  });

  it('does not emit clickView from a trailing slot click', async () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    await wrapper.get('[data-testid="trailing-btn"]').trigger('click');

    expect(wrapper.emitted('clickView')).toBeUndefined();
  });

  describe('controlled order and persistence', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('onReorder updates the local order synchronously without persisting', async () => {
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();

      const moveEvent: ReorderMoveEvent<DatabaseViewId> = {
        key: FAKE_VIEW_ID_A,
        fromIndex: 0,
        toIndex: 1,
      };
      harness.options.onReorder(moveEvent);

      expect(reorderMock).not.toHaveBeenCalled();
      await nextTick();
      const labels = wrapper.findAllComponents(MDListItem).map((item) => item.props('labelText'));
      expect(labels).toEqual(['Bravo', 'Alpha']);
    });

    it('persists exactly once after a changed, non-cancelled drag', () => {
      mountEdit({}, {}, views);
      const harness = getHarness();

      harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex: 0, toIndex: 1 });

      const dragEndEvent: ReorderDragEndEvent<DatabaseViewId> = {
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 1,
        cancelled: false,
      };
      harness.options.onDragEnd?.(dragEndEvent);

      expect(reorderMock).toHaveBeenCalledTimes(1);
      expect(reorderMock).toHaveBeenCalledWith([FAKE_VIEW_ID_B, FAKE_VIEW_ID_A]);
    });

    it('does not persist a cancelled drag', () => {
      mountEdit({}, {}, views);
      const harness = getHarness();

      harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex: 0, toIndex: 1 });
      harness.options.onDragEnd?.({
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 1,
        cancelled: true,
      });

      expect(reorderMock).not.toHaveBeenCalled();
    });

    it('does not persist a completed drag that ends with the unchanged order', () => {
      mountEdit({}, {}, views);
      const harness = getHarness();

      harness.options.onDragEnd?.({
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 0,
        cancelled: false,
      });

      expect(reorderMock).not.toHaveBeenCalled();
    });
  });

  describe('promise and confirmation sequencing', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('does not start the queued write once the active write promise resolves without entity confirmation', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();

      expect(reorderMock).toHaveBeenCalledTimes(1);
    });

    it('does not start the queued write once the entity confirms without the promise resolving', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await nextTick();

      expect(reorderMock).toHaveBeenCalledTimes(1);
    });

    it('starts the queued write only once both the promise has resolved and the entity has settled', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await nextTick();
      expect(reorderMock).toHaveBeenCalledTimes(1);

      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(reorderMock).toHaveBeenCalledTimes(2);
      });
      expect(reorderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('never has more than one reorder() promise in flight at a time', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, does not start a second promise
      await performDrag(harness, 0, 1); // A,B -> B,A: replaces the queued order, still no second promise

      expect(reorderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('latest-intent replacement', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('a newest completed drag equal to the active write replaces a differing queued order, finishing at the newest intent with no redundant write', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 active, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]
      await performDrag(harness, 0, 1); // A,B -> B,A: newest intent equals the active target [B,A];
      // it must still replace the differing queued [A,B], not be treated as a no-op.

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);
      });

      // The queued order is now [B,A], identical to the just-confirmed entity order, so no
      // redundant second write is issued.
      expect(reorderMock).toHaveBeenCalledTimes(1);
    });

    it('retains only the final not-yet-started order across three rapid completed drags', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]
      await performDrag(harness, 0, 1); // A,B -> B,A: replaces the queued order with [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: replaces it again with [A,B]

      expect(reorderMock).toHaveBeenCalledTimes(1);

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(reorderMock).toHaveBeenCalledTimes(2);
      });
      expect(reorderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('does not let equality with the active request preserve an older, different queued order', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 active, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]
      await performDrag(harness, 0, 1); // A,B -> B,A: newest intent [B,A] must replace the queued [A,B]

      // Rejecting write #1 reveals which order was actually queued: the entity's own order is
      // still [A,B], so a queued [A,B] would be dropped without a write, while a correctly
      // replaced queued [B,A] is started instead.
      firstWrite.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(reorderMock).toHaveBeenCalledTimes(2);
      });
      expect(reorderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_B, FAKE_VIEW_ID_A]);
      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);
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
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(write.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A
      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);

      write.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(labelsOf(wrapper)).toEqual(['Alpha', 'Bravo']);
      });
    });

    it('rejection with a newer, differing queued intent starts that intent', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, viewsWithThree);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1, target [B,A,C]
      await performDrag(harness, 2, 0); // B,A,C -> C,B,A: queued, target [C,B,A], distinct from
      // both the active target and the entity's own [A,B,C] order.

      firstWrite.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(reorderMock).toHaveBeenCalledTimes(2);
      });
      expect(reorderMock).toHaveBeenNthCalledWith(2, [
        FAKE_VIEW_ID_C,
        FAKE_VIEW_ID_B,
        FAKE_VIEW_ID_A,
      ]);
      expect(labelsOf(wrapper)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('rejection with a queued intent equal to the current entity order drops the queue without writing', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B], equal to the entity order

      firstWrite.reject(new Error('write failed'));
      await firstWrite.promise.catch(() => {});
      await nextTick();

      expect(reorderMock).toHaveBeenCalledTimes(1);
      expect(labelsOf(wrapper)).toEqual(['Alpha', 'Bravo']);
    });

    it('a fully confirmed earlier write does not prevent a later write from rolling back on rejection', async () => {
      const firstWrite = createDeferred<unknown>();
      const secondWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      // Write #1 is settled by both its promise and a matching entity order, so it is fully
      // confirmed and cleared before write #2 starts.
      await performDrag(harness, 0, 1); // A,B -> B,A
      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();
      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);

      reorderMock.mockReturnValueOnce(secondWrite.promise);
      await performDrag(harness, 0, 1); // Bravo,Alpha -> Alpha,Bravo: write #2
      expect(reorderMock).toHaveBeenCalledTimes(2);

      secondWrite.reject(new Error('write failed'));

      await vi.waitFor(() => {
        expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);
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
      const wrapper = mountEdit({}, {}, views);

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo (renamed)')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await nextTick();

      expect(labelsOf(wrapper)).toEqual(['Bravo (renamed)', 'Alpha']);
    });

    it('applies a competing external order immediately, replacing an unstarted queued local order, as the corrective target while the active write can still land later', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, viewsWithThree);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1 active, target [B,A,C]
      await performDrag(harness, 0, 1); // B,A,C -> A,B,C: queued, target [A,B,C]

      // A competing external order (a third permutation, distinct from both write #1's target
      // and the queued order) arrives while write #1 is still active.
      currentViews.value = [
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick();

      // The external order applies immediately, replacing the queued local order; write #1 has
      // not been asked to persist it yet.
      expect(labelsOf(wrapper)).toEqual(['Charlie', 'Alpha', 'Bravo']);
      expect(reorderMock).toHaveBeenCalledTimes(1);
    });

    it('does not let a later literal confirmation of the stale active target override the externally authoritative display, and re-asserts the corrective order once the write settles', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, viewsWithThree);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1 active, target [B,A,C]
      await performDrag(harness, 0, 1); // B,A,C -> A,B,C: queued, target [A,B,C]

      currentViews.value = [
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick(); // external order [C,A,B] applies; queued corrective target [C,A,B]

      // The entity later, briefly reports write #1's own (now-superseded) requested order [B,A,C];
      // the externally authoritative corrective display must not revert to it.
      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
      ];
      await nextTick();
      expect(labelsOf(wrapper)).toEqual(['Charlie', 'Alpha', 'Bravo']);

      firstWrite.resolve(undefined);

      await vi.waitFor(() => {
        expect(reorderMock).toHaveBeenCalledTimes(2);
      });

      // The entity's last-observed order ([B,A,C]) still differs from the corrective target
      // ([C,A,B]), so the corrective write is issued once write #1 settles.
      expect(reorderMock).toHaveBeenNthCalledWith(2, [
        FAKE_VIEW_ID_C,
        FAKE_VIEW_ID_A,
        FAKE_VIEW_ID_B,
      ]);
    });

    it('does not issue a redundant corrective write once the entity already equals the corrective order when the active write settles', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, viewsWithThree);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B,C -> B,A,C: write #1 active, target [B,A,C]

      currentViews.value = [
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick(); // external order [C,A,B] applies and remains the last-observed order

      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();

      expect(reorderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('entity emissions', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('a content-equal entity emission does not reset the live or optimistic order', async () => {
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 pending, entity still reports A,B

      // An unrelated document write re-emits the same ids in the same order as a new array.
      currentViews.value = [...views];
      await nextTick();

      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);
      expect(reorderMock).toHaveBeenCalledTimes(1);
    });

    it('a view data change with unchanged ids does not reset the controlled order', async () => {
      const wrapper = mountEdit({}, {}, views);

      currentViews.value = [
        [FAKE_VIEW_ID_A, fakeView('Alpha (renamed)')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
      ];
      await nextTick();

      expect(labelsOf(wrapper)).toEqual(['Alpha (renamed)', 'Bravo']);
    });

    it('the latest confirmed order clears the outstanding request and optimistic state', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      expect(reorderMock).toHaveBeenCalledTimes(1);

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      firstWrite.resolve(undefined);
      await firstWrite.promise;
      await nextTick();

      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);

      // The cleared request must not block a later drag back to this same order.
      await performDrag(harness, 0, 1); // Bravo,Alpha -> Alpha,Bravo
      expect(reorderMock).toHaveBeenCalledTimes(2);
    });
  });
});
