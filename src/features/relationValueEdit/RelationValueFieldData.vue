<script setup lang="ts">
import { DatabaseDataTable } from '@entity/databaseData';
import { DatabasePropertyBlock, useDatabaseProperties } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDCheckbox } from '@shared/ui/material';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  selectedValue: DatabaseItemId[];
  viewId: DatabaseViewId;
  scrollRoot: HTMLElement | null | undefined;
}>();

const emit = defineEmits<{
  select: [itemId: DatabaseItemId];
}>();

defineSlots<{
  value: (p: { itemId: DatabaseItemId; propertyId: DatabasePropertyId }) => unknown;
}>();

const { directoryPath, documentId, scrollRoot, viewId } = toRefs(props);

const { propertiesIdList, isLoading } = useDatabaseProperties(directoryPath, documentId);

const displayPropertiesIdList = computed(() => propertiesIdList.value ?? []);

const onUpdateSelectedValue = (itemId: DatabaseItemId) => {
  emit('select', itemId);
};
</script>

<template>
  <MDCircularProgressIndicator v-if="isLoading && !propertiesIdList" :size="24" />

  <DatabaseDataTable
    v-else
    class="relation-value-field-data__table"
    :directory-path="directoryPath"
    :document-id="documentId"
    :view-id="viewId"
    :properties="displayPropertiesIdList"
    :scroll-root="scrollRoot"
    :vertical-surface-offset="0"
    :horizontal-surface-offset="0"
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
        :checked="selectedValue.includes(itemId)"
        @update:checked="onUpdateSelectedValue(itemId)"
      />
    </template>
  </DatabaseDataTable>
</template>

<style lang="css" scoped>
.relation-value-field-data__table {
  min-width: 100%;
}
</style>
