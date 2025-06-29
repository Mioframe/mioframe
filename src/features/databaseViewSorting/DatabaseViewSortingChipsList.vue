<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import {
  useDatabaseViewsMap,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useSortable } from '@shared/lib/sortable';
import { MDChip } from '@shared/ui/Chips';
import { computed, ref, toRefs, useTemplateRef, watch } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  selectedId?: DatabaseViewId;
  type: 'assist' | 'filter' | 'input';
}>();

const emit = defineEmits<{
  'update:selectedId': [id: DatabaseViewId];
}>();

const { docHandle } = toRefs(props);

const databaseViewsMap = useDatabaseViewsMap(docHandle);

const viewsList = computed(() => databaseViewsMap.list);

const chipsList = ref<{ label: string; viewId: DatabaseViewId }[]>([]);

watch(
  viewsList,
  (viewsList) => {
    chipsList.value.length = 0;

    viewsList?.forEach(([viewId, { name: label }]) => {
      chipsList.value.push({
        label,
        viewId,
      });
    });
  },
  {
    immediate: true,
    deep: true,
  },
);

const onClickViewChip = (viewId: DatabaseViewId) => {
  emit('update:selectedId', viewId);
};

const chipListContainer = useTemplateRef('chipListContainer');

const { draggableItem } = useSortable(chipListContainer, chipsList);

const onEndDrag = () => {
  chipsList.value.forEach(({ viewId }, index) => {
    void databaseViewsMap.update(viewId, { order: index });
  });
};

watch(draggableItem, (item, oldItem) => {
  if (oldItem && !item) {
    onEndDrag();
  }
});
</script>

<template>
  <div ref="chipListContainer" class="database-view-sorting-chip-list">
    <MDChip
      v-for="{ viewId, label } in chipsList"
      :key="viewId"
      :label
      :selected="selectedId === viewId"
      :type
      :class="{
        'md-state_drag': draggableItem?.viewId === viewId,
      }"
      draggable
      @click="onClickViewChip(viewId)"
    />
  </div>
</template>

<style lang="css" scoped>
.database-view-sorting-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2step;
}
</style>
