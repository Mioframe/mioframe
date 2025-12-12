<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import DatabaseNestedFilterString from './DatabaseNestedFilterString.vue';
import { toRefs } from 'vue';
import type {
  DatabaseFilter,
  DatabasePropertyId,
  DatabaseViewId,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import { useDatabaseViewFilter } from '@entity/databaseFilter/useDatabaseViewFilter';
import type { DomainError } from '@shared/lib/error';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

defineSlots<{
  valueField(p: {
    property: GeneralProperty | DomainError;
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const { filter, post } = useDatabaseViewFilter(
  directoryPath,
  documentId,
  viewId,
);

const onSetFilter = (v: DatabaseFilter) => post(v);
</script>

<template>
  <DatabaseNestedFilterString
    v-if="filter"
    :filter="filter"
    :directory-path="directoryPath"
    :document-id="documentId"
    @update:filter="onSetFilter"
  >
    <template #valueField="{ property, propertyId, update, value }">
      <slot
        :value="value"
        :update="update"
        name="valueField"
        :property="property"
        :property-id="propertyId"
      />
    </template>
  </DatabaseNestedFilterString>

  <span v-else> filter is undefined </span>
</template>
