<script setup lang="ts">
import type { GeneralProperty } from '@shared/lib/databaseDocument/migrations/versions/v1/property';
import DbItemEditDialog from './DbItemEditDialog.vue';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument/migrations/versions';
import type { AMDocHandle } from '@shared/lib/automerge';
import { toRefs } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const emit = defineEmits<{
  added: [id: DatabaseItemId];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

defineSlots<{
  valueField(p: {
    property: GeneralProperty;
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
    :doc-handle="docHandle"
    headline="Add item"
    supporting-text="Fill in the properties of the new item."
    apply-label="Add"
    @created="onCreated"
    @cancel="onCancel"
  >
    <template #valueField="{ property, update, value, propertyId }">
      <slot
        name="valueField"
        :property="property"
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
