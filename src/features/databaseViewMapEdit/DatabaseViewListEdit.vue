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
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { computed, toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const { directoryPath: path, documentId } = toRefs(props);

const emit = defineEmits<{
  clickView: [viewId: DatabaseViewId];
}>();

const slots = defineSlots<{
  trailingIcon: (p: { viewId: DatabaseViewId }) => unknown;
  leadingIcon: (p: { viewId: DatabaseViewId }) => unknown;
}>();

const { reorder, views: viewList } = useDatabaseViews(path, documentId);

const viewListEl = useTemplateRef('viewListEl');

const viewMap = computed(() => new Map(viewList.value ?? []));

const { activeProfile, displayItemIdList, draggedId, isDragging } =
  useReorderSurface(viewListEl, {
    itemIdList: computed(() => (viewList.value ?? []).map(([id]) => id)),
    onCommit: ({ orderedIds }) => {
      const nextOrderedIds = orderedIds.filter((id) =>
        zodIs(id, zodDatabaseViewId),
      );

      if (nextOrderedIds.length !== orderedIds.length) {
        return;
      }

      return reorder(nextOrderedIds);
    },
  });

const displayViewIdList = computed(() =>
  displayItemIdList.value.filter((id) => zodIs(id, zodDatabaseViewId)),
);
const draggedViewId = computed(() => {
  const itemId = draggedId.value;

  return itemId && zodIs(itemId, zodDatabaseViewId) ? itemId : undefined;
});

const orderedViewList = computed(() =>
  displayViewIdList.value.reduce<
    Array<readonly [DatabaseViewId, DatabaseView]>
  >((result, id) => {
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
  <MDListContainer ref="viewListEl" transition class="db-view-map-edit">
    <MDListItem
      is="button"
      v-for="[id, view] in orderedViewList"
      :key="id"
      v-reorder-item="id"
      :headline="view.name"
      class="db-view-map-edit__view-item"
      :class="{
        'md-state_drag': draggedViewId === id,
        'db-view-map-edit__view-item_touch':
          isDragging && activeProfile.input === 'touch',
      }"
      @click="onClickView(id)"
    >
      <template v-if="!!slots.leadingIcon" #leadingIcon>
        <slot name="leadingIcon" :view-id="id" />
      </template>

      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :view-id="id" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
