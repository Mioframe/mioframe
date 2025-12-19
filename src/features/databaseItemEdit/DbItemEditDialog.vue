<script setup lang="ts">
import { computed, ref, shallowRef, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import {
  type DatabaseItem,
  type DatabaseItemId,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { useDatabaseItem } from '@entity/databaseItem';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    itemId?: DatabaseItemId;
    headline?: string;
    supportingText?: string;
    applyLabel?: string;
  }>(),
  {
    applyLabel: 'Apply',
    headline: 'Edit item',
    supportingText: 'Fill in the item properties.',
  },
);

const {
  directoryPath,
  documentId,
  applyLabel,
  headline,
  supportingText,
  itemId,
} = toRefs(props);

const emit = defineEmits<{
  updated: [item: DatabaseItem];
  created: [id: DatabaseItemId];
  cancel: [];
}>();

const showModel = defineModel<boolean>('show', { required: true });

defineSlots<{
  valueField(p: {
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const itemState = ref<DatabaseItem>({});

const { item: currentItemState, postItem } = useDatabaseItem(
  directoryPath,
  documentId,
  itemId,
);

watchEffect(() => {
  itemState.value = currentItemState.value ?? {};
});

const applyLoading = shallowRef(false);

const onApply = async () => {
  if (!loading.value) {
    try {
      applyLoading.value = true;
      if (itemId.value) {
        await postItem(itemState.value);
        emit('updated', itemState.value);
      } else {
        const id = await postItem(itemState.value);
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
    emit('cancel');
  }
};

const { propertiesIdList: properties, isLoading: isLoadingProperties } =
  useDatabaseProperties(directoryPath, documentId);

const onUpdateValue = (propertyId: DatabasePropertyId, value: unknown) => {
  itemState.value[propertyId] = value;
};

const loading = computed(() => isLoadingProperties.value || applyLoading.value);
</script>

<template>
  <MDDialog
    v-model:show="showModel"
    :headline="headline"
    :supporting-text="supportingText"
    :apply-label="applyLabel"
    has-cancel-action
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <template v-for="propertyId in properties" :key="propertyId">
      <slot
        name="valueField"
        :value="itemState[propertyId]"
        :property-id="propertyId"
        :update="(value: unknown) => onUpdateValue(propertyId, value)"
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
