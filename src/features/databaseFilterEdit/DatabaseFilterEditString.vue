<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import DatabaseNestedFilterString from './DatabaseNestedFilterString.vue';
import { computed, toRefs } from 'vue';
import type {
  DatabaseFilter,
  DatabasePropertyId,
  DatabaseViewId,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import { useDatabaseViewFilterClient } from '@entity/databaseFilter/client';
import type { EntryPath } from '@shared/lib/fileSystem';
import { DomainError } from '@shared/lib/error';

const props = defineProps<{
  directoryPath: EntryPath;
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

const { get, patch } = useDatabaseViewFilterClient();

const filter = computed({
  get: () => {
    const mbFilter = get(directoryPath.value, documentId.value, viewId.value);
    if (mbFilter instanceof DomainError) {
      return {};
    }
    return mbFilter ?? {};
  },
  set: (v: DatabaseFilter) => {
    void patch(directoryPath.value, documentId.value, viewId.value, v);
  },
});
</script>

<template>
  <DatabaseNestedFilterString
    v-model:filter="filter"
    :directory-path="directoryPath"
    :document-id="documentId"
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
</template>
