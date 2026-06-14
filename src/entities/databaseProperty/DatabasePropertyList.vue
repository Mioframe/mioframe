<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { MDList } from '@shared/ui/Lists';
import { toRefs } from 'vue';
import { useDatabaseProperties } from './useDatabaseProperties';
import DatabasePropertyListItem from './DatabasePropertyListItem.vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const slots = defineSlots<{
  trailingAction: (p: {
    property?: DatabaseUnknownProperty | undefined;
    propertyId: DatabasePropertyId;
  }) => unknown;
}>();

const { documentId, directoryPath: path } = toRefs(props);

const { propertiesIdList: properties } = useDatabaseProperties(path, documentId);
</script>

<template>
  <MDList list-style="segmented">
    <DatabasePropertyListItem
      v-for="propertyId in properties"
      :key="propertyId"
      :path="path"
      :document-id="documentId"
      :property-id="propertyId"
    >
      <template v-if="!!slots.trailingAction" #trailingAction="{ property }">
        <slot name="trailingAction" :property-id="propertyId" :property="property" />
      </template>
    </DatabasePropertyListItem>
  </MDList>
</template>
