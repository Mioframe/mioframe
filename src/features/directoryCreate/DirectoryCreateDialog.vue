<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { useFileSystem } from '@entity/mountedDirectories';
import { getFileSystemAccessRecovery, type FileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { useMainServiceClient } from '@shared/service';
import { MDButton } from '@shared/ui/Button';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { computed, ref, toRefs } from 'vue';

const props = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  created: [name: string];
  cancel: [];
}>();

const { path } = toRefs(props);

const errorText = ref<string>();
const { data: directoryStat } = useFSNodeStat(path);
const writeAccessRecovery = ref<FileSystemAccessRecovery | undefined>();

const canEditDirectoryContents = computed(() => directoryStat.value?.capabilities?.canEditChildren);

const { createDirectory } = useFileSystem();
const {
  fileSystem: { requestFileSystemAccess },
} = useMainServiceClient();

const loading = ref(false);
const isGrantLoading = ref(false);

const onApply = async () => {
  if (!directoryName.value || loading.value) {
    return;
  }

  errorText.value = undefined;
  writeAccessRecovery.value = undefined;

  if (canEditDirectoryContents.value === false) {
    errorText.value = 'Creating entries is not allowed in this directory';
    return;
  }

  try {
    loading.value = true;
    await createDirectory(PathUtils.join(path.value, directoryName.value));
    emit('created', directoryName.value);
  } catch (error) {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });
    if (recovery) {
      writeAccessRecovery.value = recovery;
      errorText.value = `Mioframe needs write access to "${recovery.spaceName}" to create this folder.`;
    } else {
      errorText.value = error instanceof Error ? error.message : 'unknown error';
    }
  } finally {
    loading.value = false;
  }
};

const onGrantWriteAccess = async () => {
  const recovery = writeAccessRecovery.value;

  if (!recovery || isGrantLoading.value) {
    return;
  }

  isGrantLoading.value = true;

  try {
    const result = await requestFileSystemAccess(recovery);

    if (result.status === 'granted') {
      writeAccessRecovery.value = undefined;
      errorText.value = undefined;
      await onApply();
      return;
    }

    errorText.value =
      result.status === 'denied'
        ? 'Editing is not allowed in this remembered space because your browser denied write access.'
        : 'Could not grant write access. Try again from this action.';
  } finally {
    isGrantLoading.value = false;
  }
};

const directoryName = ref<string>();

const directoryNameModel = computed<string | undefined>({
  get: () => directoryName.value,
  set: (name) => {
    directoryName.value = name;
  },
});

const resetState = () => {
  directoryName.value = undefined;
  errorText.value = undefined;
  writeAccessRecovery.value = undefined;
};

const onCancel = () => {
  if (!loading.value) {
    resetState();
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
    :loading="loading"
    supporting-text="Enter a name for your folder"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField
      v-model="directoryNameModel"
      label-text="Folder's name"
      :error="!!errorText"
      :supporting-text="errorText"
    />

    <MDButton
      v-if="writeAccessRecovery"
      label="Grant write access"
      color="text"
      :loading="isGrantLoading"
      @click="onGrantWriteAccess"
    />
  </MDDialog>
</template>
