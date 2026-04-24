<script setup lang="ts">
import { DatabaseDataTable } from '@entity/databaseData';
import { DatabasePropertyBlock, useDatabaseProperties } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  selectedValue: DatabaseItemId[];
  viewId: DatabaseViewId;
  onSelect: (itemId: DatabaseItemId) => void;
}>();

defineSlots<{
  value: (p: { itemId: DatabaseItemId; propertyId: DatabasePropertyId }) => unknown;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

const { propertiesIdList } = useDatabaseProperties(directoryPath, documentId);

const onUpdateSelectedValue = (itemId: DatabaseItemId) => {
  props.onSelect(itemId);
};
</script>

<template>
  <DatabaseDataTable
    v-if="propertiesIdList"
    :directory-path="directoryPath"
    :document-id="documentId"
    :view-id="viewId"
    :properties="propertiesIdList"
  >
    <template #property="{ propertyId }">
      <DatabasePropertyBlock
        :path="directoryPath"
        :document-id="documentId"
        :property-id="propertyId"
      />
    </template>

    <template #value="{ itemId, propertyId }">
      <slot name="value" :item-id="itemId" :property-id="propertyId" />
    </template>

    <template #action="{ itemId }">
      <MDCheckbox
        :model-value="selectedValue.includes(itemId)"
        @update:model-value="() => onUpdateSelectedValue(itemId)"
      />
    </template>
  </DatabaseDataTable>

  <div v-else />
</template>
