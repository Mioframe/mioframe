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
 * Drains the microtask queue deep enough for a resolved/rejected `reorder()` deferred to flow
 * through the component's `.catch().finally()` chain and, in turn, through the entity `views`
 * watcher and any Vue reactivity it schedules.
 */
const flushAsyncWork = async (): Promise<void> => {
  await Promise.resolve()
    .then(() => {})
    .then(() => {})
    .then(() => {})
    .then(() => {})
    .then(() => {})
    .then(() => {});
  await nextTick();
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
  await flushAsyncWork();
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

  describe('overlapping local intent, confirmation, rejection, and external updates', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    const labelsOf = (wrapper: ReturnType<typeof mountEdit>): string[] =>
      wrapper.findAllComponents(MDListItem).map((item) => item.props('labelText'));

    it('a second completed drag before the first write confirms is retained as the queued latest order, not misclassified as unchanged against the still-stale entity order', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: starts write #1
      expect(reorderMock).toHaveBeenCalledTimes(1);
      expect(reorderMock).toHaveBeenNthCalledWith(1, [FAKE_VIEW_ID_B, FAKE_VIEW_ID_A]);

      // The entity still reports the original [A,B] order (write #1 hasn't landed), so this
      // second drag's result equals the entity order but must still be scheduled: it is a new
      // local intent, not an unchanged no-op.
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, at most one write remains active
      expect(reorderMock).toHaveBeenCalledTimes(1);

      firstWrite.resolve(undefined);
      await flushAsyncWork();

      expect(reorderMock).toHaveBeenCalledTimes(2);
      expect(reorderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('retains only the latest not-yet-started order across three rapid completed drags', async () => {
      const firstWrite = createDeferred<unknown>();
      mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      await performDrag(harness, 0, 1); // B,A -> A,B: queued
      await performDrag(harness, 0, 1); // A,B -> B,A: replaces the queued order
      await performDrag(harness, 0, 1); // B,A -> A,B: replaces it again

      expect(reorderMock).toHaveBeenCalledTimes(1);

      firstWrite.resolve(undefined);
      await flushAsyncWork();

      expect(reorderMock).toHaveBeenCalledTimes(2);
      expect(reorderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('confirmation of the latest write synchronizes display and clears the outstanding request', async () => {
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      expect(reorderMock).toHaveBeenCalledTimes(1);

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await flushAsyncWork();

      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);

      // The cleared request must not block a later drag back to this same order.
      await performDrag(harness, 0, 1); // Bravo,Alpha -> Alpha,Bravo
      expect(reorderMock).toHaveBeenCalledTimes(2);
    });

    it('confirmation of an older request does not overwrite a newer optimistic display order', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1, target [B,A]
      await performDrag(harness, 0, 1); // B,A -> A,B: queued, target [A,B]

      firstWrite.resolve(undefined);
      await flushAsyncWork(); // write #2 (target [A,B]) is now active
      expect(reorderMock).toHaveBeenCalledTimes(2);

      // The entity confirms the first, now-superseded request ([B,A]); the newer optimistic
      // order ([A,B]) must remain displayed.
      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await flushAsyncWork();

      expect(labelsOf(wrapper)).toEqual(['Alpha', 'Bravo']);
    });

    it('a content-equal entity emission does not reset the live or optimistic order', async () => {
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1 pending, entity still reports A,B

      // An unrelated document write re-emits the same ids in the same order as a new array.
      currentViews.value = [...views];
      await flushAsyncWork();

      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);
      expect(reorderMock).toHaveBeenCalledTimes(1);
    });

    it('rejection of the only outstanding write restores the latest entity order', async () => {
      const write = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(write.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A
      expect(labelsOf(wrapper)).toEqual(['Bravo', 'Alpha']);

      write.reject(new Error('write failed'));
      await flushAsyncWork();

      expect(labelsOf(wrapper)).toEqual(['Alpha', 'Bravo']);
    });

    it('rejection of an older request does not overwrite a newer order, and the newer order still persists', async () => {
      const firstWrite = createDeferred<unknown>();
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();
      reorderMock.mockReturnValueOnce(firstWrite.promise);

      await performDrag(harness, 0, 1); // A,B -> B,A: write #1
      await performDrag(harness, 0, 1); // B,A -> A,B: queued write #2, target [A,B]

      firstWrite.reject(new Error('write failed'));
      await flushAsyncWork();

      expect(labelsOf(wrapper)).toEqual(['Alpha', 'Bravo']);
      expect(reorderMock).toHaveBeenCalledTimes(2);
      expect(reorderMock).toHaveBeenNthCalledWith(2, [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
    });

    it('an entity order matching no pending local request replaces the optimistic display', async () => {
      const wrapper = mountEdit({}, {}, views);

      currentViews.value = [
        [FAKE_VIEW_ID_B, fakeView('Bravo (renamed)')],
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
      ];
      await flushAsyncWork();

      expect(labelsOf(wrapper)).toEqual(['Bravo (renamed)', 'Alpha']);
    });

    describe('competing external order with three views', () => {
      const viewsWithThree: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
        [FAKE_VIEW_ID_A, fakeView('Alpha')],
        [FAKE_VIEW_ID_B, fakeView('Bravo')],
        [FAKE_VIEW_ID_C, fakeView('Charlie')],
      ];

      it('discards a queued local order and re-queues the external order as the corrective persistence target', async () => {
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
        await flushAsyncWork();

        // The external order applies immediately; the queued local order is discarded.
        expect(labelsOf(wrapper)).toEqual(['Charlie', 'Alpha', 'Bravo']);

        firstWrite.resolve(undefined);
        await flushAsyncWork();

        // Write #1 could still have overwritten the external order once it landed, so the
        // external order is re-asserted as the corrective write once write #1 settles.
        expect(reorderMock).toHaveBeenCalledTimes(2);
        expect(reorderMock).toHaveBeenNthCalledWith(2, [
          FAKE_VIEW_ID_C,
          FAKE_VIEW_ID_A,
          FAKE_VIEW_ID_B,
        ]);

        // A later stale confirmation of write #1's own (now-superseded) target must not
        // permanently replace the competing external order still being corrected.
        currentViews.value = [
          [FAKE_VIEW_ID_B, fakeView('Bravo')],
          [FAKE_VIEW_ID_A, fakeView('Alpha')],
          [FAKE_VIEW_ID_C, fakeView('Charlie')],
        ];
        await flushAsyncWork();

        expect(labelsOf(wrapper)).toEqual(['Charlie', 'Alpha', 'Bravo']);
      });
    });
  });
});
