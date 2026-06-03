<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { useFileSystem } from '@entity/mountedDirectories';
import { getFileSystemAccessRecovery, type FileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { useDialog } from '@shared/ui/Dialog';
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

const canEditDirectoryContents = computed(() => directoryStat.value?.capabilities?.canEditChildren);

const { createDirectory } = useFileSystem();
const { confirm } = useDialog();
const { requestAccess } = useFileSystemAccessPermissionBroker();

const loading = ref(false);
const retryCreateDirectoryErrorText = 'Could not create the folder. Try again.';

const createDirectoryEntry = async () => {
  if (!directoryName.value) {
    throw new Error('directory name is undefined');
  }

  await createDirectory(PathUtils.join(path.value, directoryName.value));
};

const requestWriteAccess = async (recovery: FileSystemAccessRecovery) => {
  const shouldGrantAccess = await confirm({
    headline: 'Grant write access',
    supportingText: `Mioframe remembers "${recovery.spaceName}", but your browser requires write access before creating a folder in it.`,
    confirmLabel: 'Grant access',
    cancelLabel: 'Not now',
  });

  if (!shouldGrantAccess) {
    errorText.value = 'Grant write access to create entries in this remembered space.';
    return false;
  }

  const result = await requestAccess(recovery);

  if (
    result.status === 'granted' ||
    result.status === 'grantedWithReplayFailures' ||
    result.status === 'grantedWithStorageFailures'
  ) {
    errorText.value = undefined;
    return true;
  }

  errorText.value =
    result.status === 'denied'
      ? 'Creating entries is not allowed in this remembered space because your browser denied write access.'
      : 'Could not request browser permission. Try again from this action.';

  return false;
};

const onApply = async () => {
  if (!directoryName.value || loading.value) {
    return;
  }

  errorText.value = undefined;

  if (canEditDirectoryContents.value === false) {
    errorText.value = 'Creating entries is not allowed in this directory';
    return;
  }

  try {
    loading.value = true;
    await createDirectoryEntry();
    emit('created', directoryName.value);
  } catch (error) {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });
    if (recovery) {
      if (await requestWriteAccess(recovery)) {
        try {
          await createDirectoryEntry();
          if (directoryName.value) {
            emit('created', directoryName.value);
          }
        } catch {
          errorText.value = retryCreateDirectoryErrorText;
        }
      }
    } else {
      errorText.value = error instanceof Error ? error.message : 'unknown error';
    }
  } finally {
    loading.value = false;
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
  </MDDialog>
</template>
