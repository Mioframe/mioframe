<script setup lang="ts">
import { QueryRoot } from '@shared/ui/Query';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseFilter } from '@shared/lib/databaseDocument';
import {
  zodDatabasePropertyId,
  type DatabasePropertyId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useDatabaseViewFilter } from './useDatabaseViewFilter';
import { computed, toRefs } from 'vue';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { LogicalOperator } from '@shared/ui/Query/constants';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

defineSlots<{
  property: (p: { propertyId: DatabasePropertyId }) => unknown;
  value: (p: { value: unknown; path: PropertyKey[] }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: {
    path: PropertyKey[];
    operator: LogicalOperator;
  }) => unknown;
}>();

const { filterQuery } = useDatabaseViewFilter(
  directoryPath,
  documentId,
  viewId,
);

const query = computed((): DatabaseFilter => filterQuery.value ?? {});
</script>

<template>
  <QueryRoot :query="query">
    <template #property="{ property: sProperty }">
      <slot
        v-if="zodIs(sProperty, zodDatabasePropertyId)"
        name="property"
        :property-id="sProperty"
      />
    </template>

    <template #value="{ value: sValue, path }">
      <slot name="value" :value="sValue" :path="path" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path, operator }">
      <slot name="groupAppend" :path="path" :operator="operator" />
    </template>
  </QueryRoot>
</template>
