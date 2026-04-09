<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { MDListContainer } from '@shared/ui/Lists';
import { toRefs } from 'vue';
import { useDatabaseProperties } from './useDatabaseProperties';
import DatabasePropertyListItem from './DatabasePropertyListItem.vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const { documentId, directoryPath: path } = toRefs(props);

const slots = defineSlots<{
  trailingIcon: (p: {
    property?: DatabaseUnknownProperty | undefined;
    propertyId: DatabasePropertyId;
  }) => unknown;
}>();

const { propertiesIdList: properties } = useDatabaseProperties(path, documentId);
</script>

<template>
  <MDListContainer>
    <DatabasePropertyListItem
      v-for="propertyId in properties"
      :key="propertyId"
      :path="path"
      :document-id="documentId"
      :property-id="propertyId"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon="{ property }">
        <slot name="trailingIcon" :property-id="propertyId" :property="property" />
      </template>
    </DatabasePropertyListItem>
  </MDListContainer>
</template>
