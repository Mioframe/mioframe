<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { useDatabaseViewsMap } from '@shared/lib/databaseDocument';
import { useSortableListener } from '@shared/lib/sortable/useSortable';
import { MDChip } from '@shared/ui/Chips';
import { toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  selectedView?: DatabaseViewId;
}>();

const { docHandle } = toRefs(props);

const emit = defineEmits<{
  clickView: [viewId: DatabaseViewId];
}>();

const slots = defineSlots<{
  trailingIcon: (p: { viewId: DatabaseViewId }) => unknown;
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
  <fieldset ref="viewListEl" class="db-view-map-edit">
    <TransitionGroup name="dnd">
      <MDChip
        v-for="([id, view], index) in databaseViewsMap.list"
        :key="id"
        :label="view.name"
        type="filter"
        :selected="selectedView === id"
        draggable
        class="db-view-map-edit__view-item"
        :class="{ 'md-state_drag': draggableIndex === index }"
        @click="onClickView(id)"
      >
        <template v-if="!!slots.trailingIcon" #trailingIcon>
          <slot name="trailingIcon" :view-id="id" />
        </template>
      </MDChip>
    </TransitionGroup>
  </fieldset>
</template>

<style lang="css" scoped>
.db-view-map-edit {
  all: unset;
  display: flex;
  gap: 2step;
}
</style>
