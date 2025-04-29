<script setup lang="ts">
import type { PropertiesMap } from '@shared/lib/databaseDocument/state/v1/property';
import DbItemEditDialog from './DbItemEditDialog.vue';
import type { DatabaseItem } from '@shared/lib/databaseDocument/state';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const emit = defineEmits<{
  add: [item: DatabaseItem];
  cancel: [];
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
