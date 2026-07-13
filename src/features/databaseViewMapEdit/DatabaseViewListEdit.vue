<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { toRefs } from 'vue';
import { useDatabaseViewListReorder } from './useDatabaseViewListReorder';

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

const { reorder, views } = useDatabaseViews(path, documentId);

const {
  orderedViewList,
  draggingKey,
  vReorderContainer,
  vReorderItem,
  vReorderActivator,
  vReorderIgnore,
} = useDatabaseViewListReorder({
  views,
  persistOrder: reorder,
});

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
