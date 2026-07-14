<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  zodDatabaseViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import {
  ReorderSurface,
  type ReorderCommitRequest,
  type ReorderCommitResult,
} from '@shared/lib/reorder';
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDList } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import DatabaseViewSortableListItem from './DatabaseViewSortableListItem.vue';

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
const canonicalIds = computed(() => (viewList.value ?? []).map(([id]) => id));

/**
 * Narrows the generic reorder-surface ids back to the domain id type that produced them.
 * @param ids - Generic string ids returned by `ReorderSurface`.
 * @returns The subset of `ids` that are valid database-view ids.
 */
const toDatabaseViewIds = (ids: readonly string[]): DatabaseViewId[] =>
  ids.filter((id): id is DatabaseViewId => zodIs(id, zodDatabaseViewId));

const onCommit = (request: ReorderCommitRequest<string>): Promise<ReorderCommitResult> =>
  reorder({
    expectedOrderedIds: toDatabaseViewIds(request.expectedOrderedIds),
    orderedIds: toDatabaseViewIds(request.orderedIds),
  });

const getOrderedViewList = (displayItemIds: readonly string[]) =>
  toDatabaseViewIds(displayItemIds).reduce<Array<readonly [DatabaseViewId, DatabaseView]>>(
    (result, id) => {
      const view = viewMap.value.get(id);

      if (!view) {
        return result;
      }

      result.push([id, view] as const);
      return result;
    },
    [],
  );

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <ReorderSurface :item-ids="canonicalIds" :commit="onCommit">
    <template #default="{ displayItemIds }">
      <MDList list-style="segmented" class="db-view-map-edit">
        <DatabaseViewSortableListItem
          v-for="([id, view], index) in getOrderedViewList(displayItemIds)"
          :key="id"
          :view-id="id"
          :index="index"
          :label-text="view.name"
          :mode="!!slots.trailingAction ? 'multi-action' : 'single-action'"
          :aria-current="id === currentViewId ? 'true' : undefined"
          @action="onClickView(id)"
        >
          <template v-if="!!slots.leading" #leading>
            <slot name="leading" :view-id="id" />
          </template>

          <template v-if="!!slots.trailingAction" #trailingAction>
            <slot name="trailingAction" :view-id="id" />
          </template>
        </DatabaseViewSortableListItem>
      </MDList>
    </template>
  </ReorderSurface>
</template>
