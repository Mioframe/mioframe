<script setup lang="ts">
import { useFileSystem } from '@entity/mountedDirectories/useFileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref, toRefs, watchEffect } from 'vue';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

const emit = defineEmits<{
  created: [name: string];
  cancel: [];
}>();

const showModel = defineModel<boolean>('show', { required: true });

const errorText = ref<string>();

const { createDirectory } = useFileSystem();

const loading = ref(false);

const onApply = async () => {
  if (directoryName.value && !loading.value) {
    errorText.value = undefined;

    try {
      loading.value = true;
      await createDirectory(PathUtils.join(path.value, directoryName.value));
      emit('created', directoryName.value);
    } catch (error) {
      errorText.value =
        error instanceof Error ? error.message : 'unknown error';
    } finally {
      loading.value = false;
    }
  }
};

const directoryName = ref<string>();

const resetState = () => {
  directoryName.value = undefined;
};

const onCancel = () => {
  if (!loading.value) {
    resetState();
    emit('cancel');
  }
};

watchEffect(() => {
  if (!showModel.value) {
    resetState();
  }
});
</script>

<template>
  <MDDialog
    v-model:show="showModel"
    headline="Create a New Folder"
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    :loading="loading"
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
