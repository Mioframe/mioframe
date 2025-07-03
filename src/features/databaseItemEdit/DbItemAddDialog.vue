<script setup lang="ts">
import type {
  GeneralProperty,
  PropertiesMap,
} from '@shared/lib/databaseDocument/migrations/state/v1/property';
import DbItemEditDialog from './DbItemEditDialog.vue';
import type { DatabaseItem } from '@shared/lib/databaseDocument/migrations/state';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const emit = defineEmits<{
  add: [item: DatabaseItem];
  cancel: [];
}>();

defineSlots<{
  valueField(p: {
    property: GeneralProperty;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const onApply = (newItem: DatabaseItem) => {
  emit('add', newItem);
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <DbItemEditDialog
    :properties
    headline="Add item"
    supporting-text="Fill in the properties of the new item."
    apply-label="Add"
    @apply="onApply"
    @cancel="onCancel"
  >
    <template #valueField="{ property, update, value }">
      <slot name="valueField" :property :update :value />
    </template>
  </DbItemEditDialog>
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
