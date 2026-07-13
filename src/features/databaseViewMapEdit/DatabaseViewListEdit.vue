<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { useReorder, type ReorderDragEndEvent } from '@shared/lib/reorder';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { computed, ref, toRefs, watch } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  // Accessible current-view state owned by the caller's view-selection composition.
  // Forwarded onto the row as `aria-current` so assistive tech can tell which view is
  // active without depending on a presentation-only leading control.
  currentViewId?: DatabaseViewId | undefined;
}>();

const emit = defineEmits<{
  clickView: [viewId: DatabaseViewId];
}>();

const slots = defineSlots<{
  trailingAction: (p: { viewId: DatabaseViewId }) => unknown;
  leading: (p: { viewId: DatabaseViewId }) => unknown;
}>();

const { directoryPath: path, documentId } = toRefs(props);

const { reorder, views: viewList } = useDatabaseViews(path, documentId);

const viewMap = computed(() => new Map(viewList.value ?? []));

/** The entity-owned canonical view order; the only authoritative source. */
const baseViewIdList = computed(() => (viewList.value ?? []).map(([id]) => id));

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

/** One in-flight or awaiting-confirmation local `reorder()` request. */
interface PendingOrderWrite {
  /** Identity used to tell this exact request apart from a later request with equal content. */
  token: symbol;
  /** The order this request asked the entity to persist. */
  requestedIds: DatabaseViewId[];
}

/** The currently in-flight `reorder()` request, or `null` when no write is active. */
let activeWrite: PendingOrderWrite | null = null;
/** The latest not-yet-started requested order; a newer one replaces it rather than queuing both. */
let queuedLatestIds: DatabaseViewId[] | null = null;
/**
 * Local write requests submitted but not yet observed as confirmed (or rejected) via the entity's
 * own order sequence, oldest first. A request leaves this list only on its own confirmation or
 * rejection.
 */
const pendingConfirmations: PendingOrderWrite[] = [];
/** The controlled order captured at drag activation; the baseline for the unchanged-drag check. */
let dragStartIds: DatabaseViewId[] | null = null;
/** The last entity order this component has observed, used to ignore content-equal re-emissions. */
let lastEntityIds: DatabaseViewId[] = [];

/**
 * @param requestedIds - A candidate order about to be scheduled for persistence.
 * @returns Whether `requestedIds` already represents the current local intent (the active write,
 * the queued next write, or the most recently submitted request with no newer intent queued),
 * so scheduling it again would be redundant.
 */
const isSameAsLatestIntent = (requestedIds: DatabaseViewId[]): boolean => {
  if (activeWrite && sameIds(requestedIds, activeWrite.requestedIds)) return true;
  if (queuedLatestIds) return sameIds(requestedIds, queuedLatestIds);

  const latestConfirmation = pendingConfirmations.at(-1);
  return latestConfirmation !== undefined && sameIds(requestedIds, latestConfirmation.requestedIds);
};

/**
 * @param requestedIds - The order to search for among outstanding local requests.
 * @returns The index of the most recently submitted {@link pendingConfirmations} entry whose
 * requested order matches `requestedIds`, or `-1` when none matches. Searching from the newest
 * entry lets a later matching confirmation safely subsume earlier, now-stale expected
 * confirmations once it is found.
 */
const findLatestPendingConfirmationIndex = (requestedIds: DatabaseViewId[]): number => {
  for (let index = pendingConfirmations.length - 1; index >= 0; index -= 1) {
    const entry = pendingConfirmations[index];
    if (entry && sameIds(entry.requestedIds, requestedIds)) return index;
  }

  return -1;
};

/**
 * Starts the next queued write once no write is active. Only one `reorder()` promise is ever
 * in flight; the request stays in {@link pendingConfirmations} until the entity's own order
 * sequence confirms it or the request rejects, since promise resolution alone is not confirmation.
 */
const flushPersist = (): void => {
  if (activeWrite || !queuedLatestIds) return;

  const request: PendingOrderWrite = {
    token: Symbol('database-view-order-write'),
    requestedIds: queuedLatestIds,
  };

  queuedLatestIds = null;
  activeWrite = request;
  pendingConfirmations.push(request);

  void reorder(request.requestedIds)
    .catch(() => {
      const index = pendingConfirmations.findIndex((entry) => entry.token === request.token);
      if (index !== -1) pendingConfirmations.splice(index, 1);

      // A newer active/queued/pending local intent must never be overwritten by an older
      // request's rejection; only restore the entity order when this was still the latest intent.
      const hasNewerLocalIntent =
        (activeWrite !== null && activeWrite.token !== request.token) ||
        queuedLatestIds !== null ||
        pendingConfirmations.length > 0;

      if (!hasNewerLocalIntent) {
        displayViewIdList.value = [...baseViewIdList.value];
      }
    })
    .finally(() => {
      if (activeWrite === request) activeWrite = null;
      flushPersist();
    });
};

/**
 * Schedules `requestedIds` as the latest persistence intent, coalescing it with any not-yet-
 * started queued order and skipping it entirely when it is already the current local intent.
 * @param requestedIds - The order to persist.
 */
const schedulePersist = (requestedIds: DatabaseViewId[]): void => {
  if (isSameAsLatestIntent(requestedIds)) return;

  queuedLatestIds = [...requestedIds];
  flushPersist();
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

    const matchIndex = findLatestPendingConfirmationIndex(next);

    if (matchIndex !== -1) {
      // Local confirmation: this and every earlier, now-subsumed request are settled.
      const confirmed = pendingConfirmations[matchIndex];
      pendingConfirmations.splice(0, matchIndex + 1);

      const hasNewerLocalIntent =
        (activeWrite !== null && activeWrite.token !== confirmed?.token) ||
        queuedLatestIds !== null ||
        pendingConfirmations.length > 0;

      if (!hasNewerLocalIntent) {
        displayViewIdList.value = [...next];
      }

      return;
    }

    // A competing external order matches no pending local request: it is authoritative and
    // applies immediately, including mid-drag (`useReorder` safely self-cancels an active session
    // once it detects the mismatch, per the library's documented external-mutation contract). Any
    // not-yet-started queued local order is discarded; a local write that is already active or
    // awaiting confirmation could still land afterward and clobber this order in storage, so it is
    // re-queued as the corrective target to be re-asserted once that write settles.
    displayViewIdList.value = [...next];
    queuedLatestIds = activeWrite !== null || pendingConfirmations.length > 0 ? [...next] : null;
    flushPersist();
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

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <MDList v-reorder-container list-style="segmented" class="db-view-map-edit">
    <MDListItem
      v-for="[id, view] in orderedViewList"
      :key="id"
      v-reorder-item="id"
      v-reorder-activator
      :mode="!!slots.trailingAction ? 'multi-action' : 'single-action'"
      :label-text="view.name"
      :dragged="draggingKey === id"
      :aria-current="id === currentViewId ? 'true' : undefined"
      class="db-view-map-edit__view-item"
      @action="onClickView(id)"
    >
      <template v-if="!!slots.leading" #leading>
        <slot name="leading" :view-id="id" />
      </template>

      <template v-if="!!slots.trailingAction" #trailingAction>
        <span v-reorder-ignore class="db-view-map-edit__trailing-action">
          <slot name="trailingAction" :view-id="id" />
        </span>
      </template>
    </MDListItem>
  </MDList>
</template>

<style scoped>
.db-view-map-edit {
  &__trailing-action {
    display: inline-flex;
  }
}
</style>
