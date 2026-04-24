<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useDocument } from '@entity/cfrDocument';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const emit = defineEmits<{
  renamed: [];
  cancel: [];
}>();

const { documentId, path } = toRefs(props);

const { state: documentDescription, patch: documentPatch } = useDocument(path, documentId);

const documentName = computed(() => documentDescription.value?.name);

const stateName = ref<string>();

const stateNameModel = computed<string | undefined>({
  get: () => stateName.value,
  set: (name) => {
    stateName.value = name;
  },
});

watchEffect(() => {
  stateName.value = documentName.value;
});

const loading = ref(0);

const onApply = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  const newName = stateName.value;

  try {
    loading.value += 1;
    await documentPatch(path.value, documentId.value, { name: newName });
  } finally {
    loading.value -= 1;
  }

  emit('renamed');
};

const resetState = () => {
  stateName.value = undefined;
};

const onCancel = () => {
  resetState();
  emit('cancel');
};

const headline = computed(() => `Rename "${documentName.value ?? 'unknown'}" document`);
</script>

<template>
  <MDDialog
    :headline="headline"
    supporting-text="Change the document title or leave it as is."
    apply-label="Rename"
    cancel-label="Cancel"
    has-cancel-action
    :loading="loading > 0"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="stateNameModel" label-text="Name" />
  </MDDialog>
</template>
