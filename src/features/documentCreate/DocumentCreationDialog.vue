<script
  setup
  lang="ts"
  generic="
    F extends {
      create: (document: {
        name: string;
        type: string;
        version: number;
      }) => void;
    }
  "
>
import { ref, watchEffect } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelect } from '@shared/ui/Select';

const props = defineProps<{
  repository: F;
}>();

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const stateName = ref<string>();

const onCreate = () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  const dType = documentType.value.at(0)?.labelText;

  if (dType) {
    props.repository.create({
      name: stateName.value,
      type: dType,
      version: 1,
    });
    emit('created');
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
  { labelText: 'Database', value: DATABASE_DOCUMENT_TYPE },
  { labelText: 'JSON Object', value: 'JsonObject' },
] as const;

const documentType = ref<(typeof documentTypeOptions)[number][]>([
  documentTypeOptions[0],
]);
</script>

<template>
  <MDDialog
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
