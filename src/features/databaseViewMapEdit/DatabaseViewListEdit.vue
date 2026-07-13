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
 * while it intentionally diverges during a live, not-yet-persisted drag.
 */
const displayViewIdList = ref<DatabaseViewId[]>([]);

// Plain (non-reactive) bookkeeping of the last base order this watcher itself applied, kept
// outside `displayViewIdList` so a content-equal re-emission can be told apart from a genuine
// external change without depending on it — nothing renders from this value.
let lastKnownBaseOrder: DatabaseViewId[] = [];

watch(
  baseViewIdList,
  (next) => {
    const changed = !sameIds(next, lastKnownBaseOrder);
    lastKnownBaseOrder = [...next];

    // A content-equal re-emission (an unrelated document write that leaves view ids/order
    // unchanged) is a no-op: overwriting here would otherwise clobber an in-progress local drag
    // with a freshly-allocated but identical array on every unrelated reactive tick.
    if (!changed) return;

    // A genuine external order change always applies, including mid-drag: `useReorder` re-reads
    // `keys` on its own and safely self-cancels the active session once it detects the mismatch
    // against its own confirmed sequence, per the library's documented external-mutation contract.
    displayViewIdList.value = [...next];
  },
  { immediate: true },
);

let persistToken = 0;

const { draggingKey, vReorderContainer, vReorderItem, vReorderActivator, vReorderIgnore } =
  useReorder<DatabaseViewId>({
    keys: displayViewIdList,
    onReorder: ({ fromIndex, toIndex }) => {
      const next = [...displayViewIdList.value];
      const [moved] = next.splice(fromIndex, 1);
      if (moved !== undefined) next.splice(toIndex, 0, moved);
      displayViewIdList.value = next;
    },
    onDragEnd: (event: ReorderDragEndEvent<DatabaseViewId>) => {
      if (event.cancelled) return;

      const requestedOrder = [...displayViewIdList.value];
      if (sameIds(requestedOrder, baseViewIdList.value)) return;

      persistToken += 1;
      const token = persistToken;

      reorder(requestedOrder).catch(() => {
        // A stale rejection from a superseded drag must not clobber newer state.
        if (token !== persistToken) return;
        displayViewIdList.value = [...baseViewIdList.value];
      });
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
