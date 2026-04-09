<script setup lang="ts">
import { computed, ref, shallowRef, toRefs, watch } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import {
  type DatabaseItem,
  type DatabaseItemId,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDatabaseEffectiveItem, useDatabaseStoredItem } from '@entity/databaseItem';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { createItemEditPayload, createItemEditState, syncItemEditState } from './itemEditState';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    itemId?: DatabaseItemId | undefined;
    headline?: string | undefined;
    supportingText?: string | undefined;
    applyLabel?: string | undefined;
  }>(),
  {
    applyLabel: 'Apply',
    headline: 'Edit item',
    supportingText: 'Fill in the item properties.',
  },
);

const { directoryPath, documentId, applyLabel, headline, supportingText, itemId } = toRefs(props);

const emit = defineEmits<{
  updated: [item: DatabaseItem];
  created: [id: DatabaseItemId];
  cancel: [];
}>();

defineSlots<{
  valueField(p: {
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
    index: number;
  }): unknown;
}>();

const itemState = ref<DatabaseItem>({});
const touchedPropertyIdSet = shallowRef<Set<DatabasePropertyId>>(new Set());

const { item: currentItemState, postItem } = useDatabaseStoredItem(
  directoryPath,
  documentId,
  itemId,
);
const { effectiveItem } = useDatabaseEffectiveItem(directoryPath, documentId, itemId);

const { propertiesIdList, isLoading: isLoadingProperties } = useDatabaseProperties(
  directoryPath,
  documentId,
);

watch(itemId, () => {
  touchedPropertyIdSet.value = new Set();
});

watch(
  [effectiveItem, propertiesIdList, touchedPropertyIdSet],
  () => {
    if (!touchedPropertyIdSet.value.size) {
      itemState.value = createItemEditState(effectiveItem.value, propertiesIdList.value);
      return;
    }

    itemState.value = syncItemEditState(
      itemState.value,
      effectiveItem.value,
      propertiesIdList.value,
      touchedPropertyIdSet.value,
    );
  },
  { immediate: true },
);

const applyLoading = shallowRef(false);

const onApply = async () => {
  if (!loading.value) {
    try {
      applyLoading.value = true;
      const payload = createItemEditPayload(
        currentItemState.value,
        itemState.value,
        touchedPropertyIdSet.value,
      );

      if (itemId.value) {
        await postItem(payload);
        emit('updated', payload);
      } else {
        const id = await postItem(payload);
        emit('created', id);
      }
    } finally {
      applyLoading.value = false;
    }
  }
};

const onCancel = () => {
  if (!loading.value) {
    itemState.value = {};
    touchedPropertyIdSet.value = new Set();
    emit('cancel');
  }
};

const onUpdateValue = (propertyId: DatabasePropertyId, value: unknown) => {
  itemState.value[propertyId] = value;
  touchedPropertyIdSet.value.add(propertyId);
};

const loading = computed(() => isLoadingProperties.value || applyLoading.value);
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="supportingText"
    :apply-label="applyLabel"
    has-cancel-action
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <template v-for="(propertyId, index) in propertiesIdList" :key="propertyId">
      <slot
        name="valueField"
        :value="itemState[propertyId]"
        :property-id="propertyId"
        :update="(value: unknown) => onUpdateValue(propertyId, value)"
        :index="index"
      />
    </template>
  </MDDialog>
</template>

<style lang="css" scoped>
.db-item-add-dialog {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
