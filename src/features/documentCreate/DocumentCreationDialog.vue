<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelect } from '@shared/ui/Select';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';

const emit = defineEmits<{
  create: [document: CFRDocumentContent];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const stateName = ref<string>();

const onCreate = () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  const dType = documentType.value.at(0)?.key;

  if (dType) {
    emit('create', {
      name: stateName.value,
      type: dType,
      version: 1,
      body: {},
    });
  }
};

const onCancel = () => {
  stateName.value = undefined;
  emit('cancel');
};

const autofocusElement = ref<HTMLElement>();

watchEffect(() => {
  autofocusElement.value?.focus();
});

const documentTypeOptions = [
  { label: 'Database', key: DATABASE_DOCUMENT_TYPE },
  { label: 'JSON Object', key: 'JsonObject' },
];

const documentType = ref<(typeof documentTypeOptions)[number][]>([
  documentTypeOptions[0],
]);
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Create Document"
    supporting-text="Think of a name and select the type of the new document."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="stateName" label-text="Name" />

    <MDSelect
      v-model:model-value="documentType"
      label-text="Document type"
      :options="documentTypeOptions"
    />
  </MDDialog>
</template>
