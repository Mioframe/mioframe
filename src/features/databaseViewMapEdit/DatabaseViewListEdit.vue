<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  zodDatabaseViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { useReorderSurface, vReorderItem } from '@shared/lib/sortable';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { computed, toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
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

const viewListEl = useTemplateRef<InstanceType<typeof MDList>>('viewListEl');
const viewListContainerEl = computed(() => viewListEl.value?.$el ?? null);

const viewMap = computed(() => new Map(viewList.value ?? []));

const { activeProfile, displayItemIdList, draggedId, isDragging } = useReorderSurface(
  viewListContainerEl,
  {
    itemIdList: computed(() => (viewList.value ?? []).map(([id]) => id)),
    onCommit: ({ orderedIds }) => {
      const nextOrderedIds = orderedIds.filter((id) => zodIs(id, zodDatabaseViewId));

      if (nextOrderedIds.length !== orderedIds.length) {
        return;
      }

      return reorder(nextOrderedIds);
    },
  },
);

const displayViewIdList = computed(() =>
  displayItemIdList.value.filter((id) => zodIs(id, zodDatabaseViewId)),
);
const draggedViewId = computed(() => {
  const itemId = draggedId.value;

  return itemId && zodIs(itemId, zodDatabaseViewId) ? itemId : undefined;
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
  <MDList ref="viewListEl" list-style="segmented" class="db-view-map-edit">
    <MDListItem
      v-for="[id, view] in orderedViewList"
      :key="id"
      v-reorder-item="id"
      :mode="!!slots.trailingAction ? 'multi-action' : 'single-action'"
      :label-text="view.name"
      :dragged="draggedViewId === id"
      class="db-view-map-edit__view-item"
      :class="{
        'db-view-map-edit__view-item_touch': isDragging && activeProfile.input === 'touch',
      }"
      @action="onClickView(id)"
    >
      <template v-if="!!slots.leading" #leading>
        <slot name="leading" :view-id="id" />
      </template>

      <template v-if="!!slots.trailingAction" #trailingAction>
        <slot name="trailingAction" :view-id="id" />
      </template>
    </MDListItem>
  </MDList>
</template>
