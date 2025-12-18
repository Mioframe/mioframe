<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import { useRepository } from '@entity/repository';
import { strictRecordGet } from '@shared/lib/strictRecord';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const showModel = defineModel<boolean>('show', { required: true });

const stateName = ref<string>();

const { createDocument } = useRepository(path);

const onCreate = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  if (selectedDocumentType.value) {
    await createDocument({
      name: stateName.value.trim(),
      type: selectedDocumentType.value,
      version: 1,
      body: {},
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

const documentTypes = {
  [DATABASE_DOCUMENT_TYPE]: 'Database',
  JsonObject: 'JSON Object',
};

const selectedDocumentTypes = ref<(keyof typeof documentTypes)[]>([
  DATABASE_DOCUMENT_TYPE,
]);

const selectedDocumentType = computed(() => selectedDocumentTypes.value.at(0));

const selectedDocumentTypeLabel = computed((): string | undefined => {
  if (selectedDocumentType.value) {
    return strictRecordGet(documentTypes, selectedDocumentType.value);
  }

  return undefined;
});
</script>

<template>
  <MDDialog
    v-model:show="showModel"
    headline="Create Document"
    supporting-text="Think of a name and select the type of the new document."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="stateName" label-text="Name" />

    <MDSelectBase
      v-model:model-value="selectedDocumentTypes"
      label-text="Document type"
    >
      <template #valueContainer>
        <span>{{ selectedDocumentTypeLabel }}</span>
      </template>

      <template #options>
        <MDSelectOption
          v-for="(label, value) in documentTypes"
          :key="label"
          :value="value"
          :label="label"
        />
      </template>
    </MDSelectBase>
  </MDDialog>
</template>
