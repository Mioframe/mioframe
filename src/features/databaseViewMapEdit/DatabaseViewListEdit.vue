<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { ReorderSurface } from '@shared/lib/reorder';
import { MDList } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import DatabaseViewSortableListItem from './DatabaseViewSortableListItem.vue';
import { useDatabaseViewReorderState } from './useDatabaseViewReorderState';

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

const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(canonicalIds, reorder);

const getViewName = (id: DatabaseViewId): string => viewMap.value.get(id)?.name ?? '';

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <ReorderSurface :item-ids="displayIds" :disabled="isPending" @reorder="onReorder">
    <MDList list-style="segmented" class="db-view-map-edit">
      <DatabaseViewSortableListItem
        v-for="(id, index) in displayIds"
        :key="id"
        :view-id="id"
        :index="index"
        :label-text="getViewName(id)"
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
  </ReorderSurface>
</template>
