import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { useReorder } from '@shared/lib/reorder';
import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';
import { normalizeRequestedOrder, sameIds, sameIdSet } from './reorderState';

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

interface LatestReorderIntent {
  requestedIds: DatabaseViewId[];
  promiseResolved: boolean;
  entityConfirmed: boolean;
}

/**
 * Owns the database-view drag-reorder workflow: temporary controlled display order, active-drag
 * protection, optimistic latest-intent reconciliation, and one persistence request per completed
 * changed gesture. Persistence sequencing itself remains worker-owned.
 * @param options - The injected view list and persistence contract.
 * @returns The ordered view list and drag-reorder directives/state for the row list.
 */
export const useDatabaseViewListReorder = ({
  views,
  persistOrder,
}: UseDatabaseViewListReorderOptions) => {
  const viewMap = computed(() => new Map(views.value ?? []));
  const baseViewIdList = computed(() => (views.value ?? []).map(([id]) => id));

  const displayViewIdList = ref<DatabaseViewId[]>([]);

  let latestIntent: LatestReorderIntent | null = null;
  let dragActive = false;
  let lastEntityIds: DatabaseViewId[] = [];
  let disposed = false;

  const reconcileDisplay = (): void => {
    if (dragActive) return;

    const nextDisplayIds = latestIntent
      ? normalizeRequestedOrder(latestIntent.requestedIds, lastEntityIds)
      : lastEntityIds;

    if (!sameIds(displayViewIdList.value, nextDisplayIds)) {
      displayViewIdList.value = [...nextDisplayIds];
    }
  };

  const completeLatestIntentIfReady = (): void => {
    if (!latestIntent?.promiseResolved || !latestIntent.entityConfirmed) return;

    latestIntent = null;
    if (!disposed) reconcileDisplay();
  };

  const startLatestIntent = (requestedIds: DatabaseViewId[]): void => {
    const intent: LatestReorderIntent = {
      requestedIds: [...requestedIds],
      promiseResolved: false,
      entityConfirmed: false,
    };
    latestIntent = intent;

    void persistOrder(intent.requestedIds).then(
      () => {
        if (latestIntent !== intent) return;
        intent.promiseResolved = true;
        if (!disposed) completeLatestIntentIfReady();
      },
      () => {
        if (latestIntent !== intent) return;

        latestIntent = null;
        if (!disposed && !dragActive) {
          displayViewIdList.value = [...lastEntityIds];
        }
      },
    );
  };

  watch(
    baseViewIdList,
    (nextCanonicalIds) => {
      if (sameIds(nextCanonicalIds, lastEntityIds)) return;

      const hadSameMembership = sameIdSet(lastEntityIds, nextCanonicalIds);
      lastEntityIds = [...nextCanonicalIds];

      if (!hadSameMembership) {
        displayViewIdList.value = normalizeRequestedOrder(displayViewIdList.value, lastEntityIds);

        if (latestIntent) {
          latestIntent.requestedIds = normalizeRequestedOrder(
            latestIntent.requestedIds,
            lastEntityIds,
          );
          if (sameIds(lastEntityIds, latestIntent.requestedIds)) {
            latestIntent.entityConfirmed = true;
            if (!disposed) completeLatestIntentIfReady();
          }
        }

        if (!disposed) reconcileDisplay();
        return;
      }

      if (latestIntent) {
        const expectedIds = normalizeRequestedOrder(latestIntent.requestedIds, lastEntityIds);
        if (sameIds(lastEntityIds, expectedIds)) {
          latestIntent.entityConfirmed = true;
          if (!disposed) completeLatestIntentIfReady();
        }
      }

      if (!disposed) reconcileDisplay();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
  });

  const { draggingKey, vReorderContainer, vReorderItem, vReorderActivator, vReorderIgnore } =
    useReorder<DatabaseViewId>({
      keys: displayViewIdList,
      onDragStart: () => {
        dragActive = true;
      },
      onReorder: ({ orderedKeys }) => {
        displayViewIdList.value = [...orderedKeys];
      },
      onDragEnd: ({ cancelled, changed, orderedKeys }) => {
        dragActive = false;

        if (!cancelled && changed && !disposed) {
          startLatestIntent([...orderedKeys]);
        }

        if (!disposed) reconcileDisplay();
      },
    });

  const orderedViewList = computed(() =>
    displayViewIdList.value.reduce<Array<readonly [DatabaseViewId, DatabaseView]>>((result, id) => {
      const view = viewMap.value.get(id);
      if (!view) return result;

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
