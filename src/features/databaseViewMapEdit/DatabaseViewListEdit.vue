<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { useDatabaseViewsMap } from '@shared/lib/databaseDocument';
import { useSortableListener } from '@shared/lib/sortable/useSortable';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const emit = defineEmits<{
  clickView: [viewId: DatabaseViewId];
}>();

const slots = defineSlots<{
  trailingIcon: (p: { viewId: DatabaseViewId }) => unknown;
  leadingIcon: (p: { viewId: DatabaseViewId }) => unknown;
}>();

const databaseViewsMap = useDatabaseViewsMap(docHandle);

const viewListEl = useTemplateRef('viewListEl');

const { draggableIndex } = useSortableListener(viewListEl, (from, to) => {
  void databaseViewsMap.changeOrder(from, to);
});

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <MDListContainer ref="viewListEl" transition class="db-view-map-edit">
    <MDListItem
      is="button"
      v-for="([id, view], index) in databaseViewsMap.list"
      :key="id"
      :headline="view.name"
      draggable
      class="db-view-map-edit__view-item"
      :class="{ 'md-state_drag': draggableIndex === index }"
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
