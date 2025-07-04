<script setup lang="ts">
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref } from 'vue';

const emit = defineEmits<{
  create: [name: string];
  cancel: [];
}>();

const loading = ref(false);

const errorText = ref<string>();

const onApply = () => {
  if (!loading.value && directoryName.value) {
    errorText.value = undefined;
    loading.value = true;
    emit('create', directoryName.value);
  }
};

const directoryName = ref<string>();

const onCancel = () => {
  if (!loading.value) {
    directoryName.value = undefined;
    emit('cancel');
  }
};
</script>

<template>
  <MDDialog
    headline="Create a New Folder"
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    supporting-text="Enter a name for your folder"
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField
      v-model="directoryName"
      label-text="Folder's name"
      :error="!!errorText"
      :supporting-text="errorText"
    />
  </MDDialog>
</template>
