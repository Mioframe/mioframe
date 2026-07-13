import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { useReorder, type ReorderDragEndEvent } from '@shared/lib/reorder';
import { computed, ref, watch, type Ref } from 'vue';

/**
 * Narrow injected contract for {@link useDatabaseViewListReorder}: the entity-owned view list and
 * its `reorder()` mutation, without the composable calling `useDatabaseViews` itself.
 */
export interface UseDatabaseViewListReorderOptions {
  /** The entity-owned canonical view list, in canonical order. */
  views: Readonly<Ref<readonly (readonly [DatabaseViewId, DatabaseView])[] | undefined>>;

  /** Persists an explicit view order for the current document. */
  persistOrder: (orderedIds: DatabaseViewId[]) => Promise<unknown>;
}

/**
 * Owns the database-view drag-reorder workflow: controlled display order, drag lifecycle
 * integration, persistence scheduling, active/queued write coordination, entity-stream
 * reconciliation, and rejection/external-update handling.
 * @param options - The injected view list and persistence contract.
 * @returns The ordered view list and drag-reorder directives/state for the row list.
 */
export const useDatabaseViewListReorder = ({
  views,
  persistOrder,
}: UseDatabaseViewListReorderOptions) => {
  const viewMap = computed(() => new Map(views.value ?? []));

  /** The entity-owned canonical view order; the only authoritative source. */
  const baseViewIdList = computed(() => (views.value ?? []).map(([id]) => id));

  /**
   * @param a - The first id sequence.
   * @param b - The second id sequence.
   * @returns Whether `a` and `b` contain the same ids in the same order.
   */
  const sameIds = (a: readonly DatabaseViewId[], b: readonly DatabaseViewId[]): boolean =>
    a.length === b.length && a.every((id, index) => id === b[index]);

  /**
   * The controlled order passed to `useReorder`. Synchronously mirrors `baseViewIdList` except
   * while it intentionally diverges during a live, not-yet-persisted drag or an outstanding local
   * persistence request.
   */
  const displayViewIdList = ref<DatabaseViewId[]>([]);

  /** The one in-flight local `reorder()` request, tracked until both its promise and entity settle. */
  interface ActiveOrderWrite {
    /** The order this request asked the entity to persist. */
    requestedIds: DatabaseViewId[];
    /** Whether the `reorder()` promise has settled successfully. */
    promiseResolved: boolean;
    /**
     * Whether the entity stream has produced an authoritative outcome for this write, either by
     * confirming its requested order or by publishing a competing external order that supersedes it.
     */
    entitySettled: boolean;
  }

  /** The currently active `reorder()` request, or `null` when no write is active. */
  let activeWrite: ActiveOrderWrite | null = null;
  /**
   * The latest not-yet-started requested order. A newer completed drag or corrective external order
   * always replaces this, even when it is content-equal to {@link activeWrite}'s requested order,
   * since an older, different queued order may still exist.
   */
  let queuedLatestIds: DatabaseViewId[] | null = null;
  /** The controlled order captured at drag activation; the baseline for the unchanged-drag check. */
  let dragStartIds: DatabaseViewId[] | null = null;
  /** The last entity order this component has observed, used to ignore content-equal re-emissions. */
  let lastEntityIds: DatabaseViewId[] = [];

  /**
   * Starts persisting `requestedIds` as the one active write. Only called when no write is active.
   * @param requestedIds - The order to persist.
   */
  const startWrite = (requestedIds: DatabaseViewId[]): void => {
    const write: ActiveOrderWrite = {
      requestedIds: [...requestedIds],
      promiseResolved: false,
      entitySettled: false,
    };

    queuedLatestIds = null;
    activeWrite = write;

    void persistOrder(write.requestedIds).then(
      () => {
        write.promiseResolved = true;
        completeActiveWriteIfReady();
      },
      () => {
        // A newer write already replaced this one; this rejection no longer applies.
        if (activeWrite !== write) return;

        activeWrite = null;

        if (!queuedLatestIds) {
          displayViewIdList.value = [...lastEntityIds];
          return;
        }

        if (sameIds(queuedLatestIds, lastEntityIds)) {
          queuedLatestIds = null;
          return;
        }

        startWrite(queuedLatestIds);
      },
    );
  };

  /**
   * Clears {@link activeWrite} once its promise has resolved and the entity has settled its
   * outcome, then starts the next queued write if one is still needed. Promise resolution and
   * entity settlement are independent, order-unspecified events; neither alone is sufficient.
   */
  const completeActiveWriteIfReady = (): void => {
    if (!activeWrite || !activeWrite.promiseResolved || !activeWrite.entitySettled) return;

    activeWrite = null;

    if (!queuedLatestIds) return;

    if (sameIds(queuedLatestIds, lastEntityIds)) {
      queuedLatestIds = null;
      return;
    }

    startWrite(queuedLatestIds);
  };

  /**
   * Schedules `requestedIds` as the latest persistence intent: starts it immediately when no write
   * is active (unless it already matches the latest entity order), otherwise always replaces the
   * queued order, even when `requestedIds` matches the active write's own requested order.
   * @param requestedIds - The order to persist.
   */
  const schedulePersist = (requestedIds: DatabaseViewId[]): void => {
    if (!activeWrite) {
      if (sameIds(requestedIds, lastEntityIds)) return;
      startWrite(requestedIds);
      return;
    }

    queuedLatestIds = [...requestedIds];
  };

  watch(
    baseViewIdList,
    (next) => {
      // A content-equal re-emission (an unrelated document write that leaves view ids/order
      // unchanged) is a no-op: overwriting here would otherwise clobber an in-progress local drag
      // or optimistic write with a freshly-allocated but identical array on every unrelated
      // reactive tick.
      if (sameIds(next, lastEntityIds)) return;
      lastEntityIds = [...next];

      if (activeWrite && sameIds(next, activeWrite.requestedIds)) {
        // Local confirmation of the active write's own requested order.
        activeWrite.entitySettled = true;
        // No newer queued intent: synchronize display to the now-canonical entity order. A newer
        // queued intent keeps the already-matching optimistic display as-is (see invariant below).
        if (!queuedLatestIds) displayViewIdList.value = [...next];
        completeActiveWriteIfReady();
        return;
      }

      // A competing external order matches no active local request: it is authoritative and applies
      // immediately, including mid-drag (`useReorder` safely self-cancels an active session once it
      // detects the mismatch, per the library's documented external-mutation contract).
      displayViewIdList.value = [...next];

      // Whenever `queuedLatestIds` is set, `displayViewIdList` already equals it (every assignment
      // above keeps this invariant), so no separate confirmation is needed once it later matches.
      // An active write could still land afterward and clobber this order in storage, so it is
      // queued as the corrective target to be re-asserted once that write settles; with no active
      // write, any stale queued order is impossible and is cleared instead.
      queuedLatestIds = activeWrite ? [...next] : null;

      if (activeWrite) {
        // The active request has been superseded by this authoritative competing entity order, so
        // the write's own requested order may never be echoed back literally (a concurrent external
        // edit can permanently supersede it). Waiting on a literal match would then block completion
        // forever: this competing order is itself a valid entity settlement, sufficient to know
        // whether it is safe to re-assert the corrective order above.
        activeWrite.entitySettled = true;
        completeActiveWriteIfReady();
      }
    },
    { immediate: true },
  );

  const { draggingKey, vReorderContainer, vReorderItem, vReorderActivator, vReorderIgnore } =
    useReorder<DatabaseViewId>({
      keys: displayViewIdList,
      onDragStart: () => {
        dragStartIds = [...displayViewIdList.value];
      },
      onReorder: ({ fromIndex, toIndex }) => {
        const next = [...displayViewIdList.value];
        const [moved] = next.splice(fromIndex, 1);
        if (moved !== undefined) next.splice(toIndex, 0, moved);
        displayViewIdList.value = next;
      },
      onDragEnd: (event: ReorderDragEndEvent<DatabaseViewId>) => {
        const startIds = dragStartIds;
        dragStartIds = null;

        if (event.cancelled) return;

        const finalIds = [...displayViewIdList.value];
        // Compare against the order captured at drag activation, never only against the entity
        // order: the entity order can still lag behind an earlier optimistic write. `startIds` is
        // only absent when a consumer calls `onDragEnd` without a preceding `onDragStart`, which the
        // real library never does; falling back to the entity order keeps that case inert too.
        if (sameIds(finalIds, startIds ?? baseViewIdList.value)) return;

        schedulePersist(finalIds);
      },
    });

  const orderedViewList = computed(() =>
    displayViewIdList.value.reduce<Array<readonly [DatabaseViewId, DatabaseView]>>((result, id) => {
      const view = viewMap.value.get(id);

      if (!view) {
        return result;
      }

      result.push([id, view] as const);
      return result;
    }, []),
  );

  return {
    orderedViewList,
    draggingKey,
    vReorderContainer,
    vReorderItem,
    vReorderActivator,
    vReorderIgnore,
  };
};
