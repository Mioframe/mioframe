<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import {
  useDatabaseViewsMap,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDChip } from '@shared/ui/Chips';
import { isArray, isUndefined } from 'es-toolkit/compat';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  selectedId?: DatabaseViewId[] | DatabaseViewId;
  type: 'assist' | 'filter' | 'input';
}>();

const emit = defineEmits<{
  click: [id: DatabaseViewId];
}>();

const { docHandle } = toRefs(props);

const databaseViewsMap = useDatabaseViewsMap(docHandle);

const viewsList = computed(() => databaseViewsMap.list);

const viewButtons = useReduceIterable(
  viewsList,
  (acc, [viewId, { name }]) => {
    acc.push({
      label: name,
      viewId,
    });
  },
  <{ label: string; viewId: DatabaseViewId }[]>[],
);

const onClickViewChip = (viewId: DatabaseViewId) => {
  emit('click', viewId);
};

const isSelected = (viewId: DatabaseViewId): boolean => {
  if (isUndefined(props.selectedId)) {
    return false;
  }

  if (props.selectedId === viewId) {
    return true;
  }

  if (isArray(props.selectedId)) {
    return props.selectedId.includes(viewId);
  }

  return false;
};
</script>

<template>
  <div class="database-view-chips-list">
    <MDChip
      v-for="{ viewId, label } in viewButtons"
      :key="viewId"
      :label
      :selected="isSelected(viewId)"
      :type
      @click="onClickViewChip(viewId)"
    />
  </div>
</template>

<style lang="css" scoped>
.database-view-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1step 2step;
}
</style>
