<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDChip } from '@shared/ui/Chips';
import { isArray, isUndefined } from 'es-toolkit/compat';
import { toRefs } from 'vue';
import { useDatabaseViews } from './useDatabaseViews';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  selectedId?: DatabaseViewId[] | DatabaseViewId | undefined;
  type: 'assist' | 'filter' | 'input';
  autofocus?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [id: DatabaseViewId];
}>();

const { directoryPath, documentId } = toRefs(props);

const { views: viewList } = useDatabaseViews(directoryPath, documentId);

const viewButtons = useReduceIterable(
  viewList,
  (acc, [viewId, { name }]) => {
    acc.push({
      label: name,
      viewId,
    });
  },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- generic type parameter requires assertion for empty array
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
      v-for="({ viewId, label }, index) in viewButtons"
      :key="viewId"
      :label="label"
      :selected="isSelected(viewId)"
      :type="type"
      :autofocus="!index ? autofocus : undefined"
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
