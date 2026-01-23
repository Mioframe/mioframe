<script setup lang="ts">
import { QueryRoot } from '@shared/ui/Query';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  zodDatabasePropertyId,
  type DatabasePropertyId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useDatabaseViewFilter } from './useDatabaseViewFilter';
import { computed, toRefs } from 'vue';
import { zodIs } from '@shared/lib/validateZodScheme';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

defineSlots<{
  property: (p: { propertyId: DatabasePropertyId }) => unknown;
  value: (p: { value: unknown }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[] }) => unknown;
  append: () => unknown;
}>();

const { filterQuery } = useDatabaseViewFilter(
  directoryPath,
  documentId,
  viewId,
);

const query = computed(() => filterQuery.value ?? {});
</script>

<template>
  <div class="filter-query">
    <QueryRoot :query="query">
      <template #property="{ property: sProperty }">
        <slot
          v-if="zodIs(sProperty, zodDatabasePropertyId)"
          name="property"
          :property-id="sProperty"
        />
      </template>

      <template #value="{ value: sValue }">
        <slot name="value" :value="sValue" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path }">
        <slot name="groupAppend" :path="path" />
      </template>
    </QueryRoot>

    <slot name="append" />
  </div>
</template>
