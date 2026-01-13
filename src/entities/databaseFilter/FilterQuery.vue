<script setup lang="ts">
import { QueryRoot } from '@shared/ui/Query';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { useDatabaseViewFilter } from './useDatabaseViewFilter';
import { toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
}>();

const { filterQuery } = useDatabaseViewFilter(
  directoryPath,
  documentId,
  viewId,
);

// TODO: добавить интеграцию свойств из документов
// TODO: добавить слоты для действий
</script>

<template>
  <div class="filter-query">
    <QueryRoot v-if="filterQuery" :query="filterQuery" />
  </div>
</template>
