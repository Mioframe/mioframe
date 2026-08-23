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
import { useElementBounding } from '@vueuse/core';
import { computed, onUpdated, toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  selectedValue: DatabaseItemId[];
  viewId: DatabaseViewId;
  scrollRoot: HTMLElement | null | undefined;
  onSelect: (itemId: DatabaseItemId) => void;
}>();

defineSlots<{
  value: (p: { itemId: DatabaseItemId; propertyId: DatabasePropertyId }) => unknown;
}>();

const { directoryPath, documentId, scrollRoot, viewId } = toRefs(props);

const { propertiesIdList, isLoading } = useDatabaseProperties(directoryPath, documentId);

const displayPropertiesIdList = computed(() => propertiesIdList.value ?? []);
const tableSurface = useTemplateRef<HTMLElement>('tableSurface');
const rootBounding = useElementBounding(scrollRoot);
const tableBounding = useElementBounding(tableSurface);

const updateSurfaceBounds = () => {
  rootBounding.update();
  tableBounding.update();
};

onUpdated(updateSurfaceBounds);

const verticalSurfaceOffset = computed(() => {
  const root = scrollRoot.value;

  if (!root || !tableSurface.value) {
    return 0;
  }

  return tableBounding.top.value - rootBounding.top.value - root.clientTop + root.scrollTop;
});

const horizontalSurfaceOffset = computed(() => {
  const root = scrollRoot.value;

  if (!root || !tableSurface.value) {
    return 0;
  }

  return tableBounding.left.value - rootBounding.left.value - root.clientLeft + root.scrollLeft;
});

const onUpdateSelectedValue = (itemId: DatabaseItemId) => {
  props.onSelect(itemId);
};
</script>

<template>
  <MDCircularProgressIndicator v-if="isLoading && !propertiesIdList" :size="24" />

  <div ref="tableSurface" class="relation-value-field-data__table-surface">
    <DatabaseDataTable
      :directory-path="directoryPath"
      :document-id="documentId"
      :view-id="viewId"
      :properties="displayPropertiesIdList"
      :scroll-root="scrollRoot"
      :vertical-surface-offset="verticalSurfaceOffset"
      :horizontal-surface-offset="horizontalSurfaceOffset"
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
  </div>
</template>

<style lang="css" scoped>
.relation-value-field-data__table-surface {
  min-width: 100%;
}
</style>
