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
import { MDCircularProgressIndicator } from '@shared/ui/material';
import { computed, toRefs } from 'vue';

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

const { propertiesIdList, isLoading } = useDatabaseProperties(directoryPath, documentId);

const displayPropertiesIdList = computed(() => propertiesIdList.value ?? []);

const onUpdateSelectedValue = (itemId: DatabaseItemId) => {
  props.onSelect(itemId);
};
</script>

<template>
  <MDCircularProgressIndicator v-if="isLoading && !propertiesIdList" :size="24" />

  <DatabaseDataTable
    :directory-path="directoryPath"
    :document-id="documentId"
    :view-id="viewId"
    :properties="displayPropertiesIdList"
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
        @update:model-value="onUpdateSelectedValue(itemId)"
      />
    </template>
  </DatabaseDataTable>
</template>
