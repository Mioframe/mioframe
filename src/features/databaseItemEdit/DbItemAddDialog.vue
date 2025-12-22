<script setup lang="ts">
import DbItemEditDialog from './DbItemEditDialog.vue';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument/migrations/versions';
import type { AMDocumentId } from '@shared/lib/automerge';
import { toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const { documentId } = toRefs(props);

const emit = defineEmits<{
  added: [id: DatabaseItemId];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

defineSlots<{
  valueField(p: {
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const onCreated = (id: DatabaseItemId) => {
  emit('added', id);
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <DbItemEditDialog
    v-model:show="show"
    :directory-path="directoryPath"
    :document-id="documentId"
    headline="Add item"
    supporting-text="Fill in the properties of the new item."
    apply-label="Add"
    @created="onCreated"
    @cancel="onCancel"
  >
    <template #valueField="{ update, value, propertyId }">
      <slot
        name="valueField"
        :update="update"
        :value="value"
        :property-id="propertyId"
      />
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
