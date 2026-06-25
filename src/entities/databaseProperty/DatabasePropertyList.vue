<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { MDList } from '@shared/ui/Lists';
import DatabasePropertyListItem from './DatabasePropertyListItem.vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  // Already-read property IDs, owned by the caller's own useDatabaseProperties read.
  // Accepting them explicitly avoids this list re-subscribing to the same entity read.
  propertyIdList: DatabasePropertyId[];
}>();

const slots = defineSlots<{
  trailingAction: (p: {
    property?: DatabaseUnknownProperty | undefined;
    propertyId: DatabasePropertyId;
  }) => unknown;
}>();
</script>

<template>
  <MDList list-style="segmented">
    <DatabasePropertyListItem
      v-for="propertyId in props.propertyIdList"
      :key="propertyId"
      :path="props.directoryPath"
      :document-id="props.documentId"
      :property-id="propertyId"
    >
      <template v-if="!!slots.trailingAction" #trailingAction="{ property }">
        <slot name="trailingAction" :property-id="propertyId" :property="property" />
      </template>
    </DatabasePropertyListItem>
  </MDList>
</template>
