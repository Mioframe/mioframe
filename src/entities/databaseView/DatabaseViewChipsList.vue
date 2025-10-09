<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDChip } from '@shared/ui/Chips';
import { isArray, isUndefined } from 'es-toolkit/compat';
import { computed, toRefs } from 'vue';
import { useDatabaseViewsClient } from './viewsClient';
import { DomainError } from '@shared/lib/error';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  selectedId?: DatabaseViewId[] | DatabaseViewId;
  type: 'assist' | 'filter' | 'input';
}>();

const emit = defineEmits<{
  click: [id: DatabaseViewId];
}>();

const { directoryPath, documentId } = toRefs(props);

const {
  getViewList: { get: getViewList },
} = useDatabaseViewsClient();

const viewListClient = computed(() =>
  getViewList(directoryPath.value, documentId.value),
);

const clientError = computed(() => {
  if (viewListClient.value instanceof DomainError) {
    return viewListClient.value;
  }
  return undefined;
});

const viewsList = computed(() => {
  if (!(viewListClient.value instanceof DomainError)) {
    return viewListClient.value;
  }
  return undefined;
});

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
    <span v-if="clientError">{{ clientError.message }}</span>

    <template v-else>
      <MDChip
        v-for="{ viewId, label } in viewButtons"
        :key="viewId"
        :label="label"
        :selected="isSelected(viewId)"
        :type="type"
        @click="onClickViewChip(viewId)"
      />
    </template>
  </div>
</template>

<style lang="css" scoped>
.database-view-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1step 2step;
}
</style>
