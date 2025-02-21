<script
  setup
  lang="ts"
  generic="
    D extends { createDirectory: (name: string) => Promise<RefDirectory> }
  "
>
import type { RefDirectory } from '@shared/lib/refFileSystem';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref } from 'vue';

const { parentDirectory } = defineProps<{
  parentDirectory: D;
}>();

const emit = defineEmits<{
  created: [name: string, directory: RefDirectory];
  cancel: [];
}>();

const loading = ref(false);

const errorText = ref<string>();

const onApply = async () => {
  try {
    if (!loading.value && directoryName.value) {
      errorText.value = undefined;
      loading.value = true;
      const newDirectory = await parentDirectory.createDirectory(
        directoryName.value,
      );
      emit('created', directoryName.value, newDirectory);
    }
  } catch (error) {
    if (error instanceof Error) {
      errorText.value = error.message;
    }
  } finally {
    loading.value = false;
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
    :loading
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
