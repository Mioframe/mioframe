<script setup lang="ts">
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref, watchEffect } from 'vue';

const emit = defineEmits<{
  create: [name: string];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const errorText = ref<string>();

const onApply = () => {
  if (directoryName.value) {
    errorText.value = undefined;

    emit('create', directoryName.value);
  }
};

const directoryName = ref<string>();

const resetState = () => {
  directoryName.value = undefined;
};

const onCancel = () => {
  resetState();
  emit('cancel');
};

watchEffect(() => {
  if (!show.value) {
    resetState();
  }
});
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Create a New Folder"
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    supporting-text="Enter a name for your folder"
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
