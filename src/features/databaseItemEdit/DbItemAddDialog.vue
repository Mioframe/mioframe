<script setup lang="ts">
import type { PropertiesMap } from '@shared/lib/databaseDocument/property';
import type { Item } from '@shared/lib/databaseDocument';
import DbItemEditDialog from './DbItemEditDialog.vue';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const emit = defineEmits<{
  add: [item: Item];
  cancel: [];
}>();

const onApply = (newItem: Item) => {
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
  />
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
