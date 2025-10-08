<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import { useDatabasePropertiesClient } from './client';
import { strictRecordIterableEntries } from '@shared/lib/strictRecord';
import { DomainError } from '@shared/lib/error';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
}>();

const { documentId, directoryPath } = toRefs(props);

const slots = defineSlots<{
  trailingIcon: (p: {
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
}>();

const { getDatabaseProperties } = useDatabasePropertiesClient();

const properties = computed(() => {
  const properties = getDatabaseProperties(
    directoryPath.value,
    documentId.value,
  );

  if (properties instanceof DomainError) {
    return undefined;
  }

  return properties;
});
</script>

<template>
  <MDListContainer>
    <MDListItem
      v-for="[propertyId, property] in strictRecordIterableEntries(
        properties,
      )()"
      :key="propertyId"
      :headline="property.name"
      :supporting-text="String(property.type)"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot
          name="trailingIcon"
          :property="property"
          :property-id="propertyId"
        />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
