<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { useDeviceDirectoryAccessRecovery } from '@feature/deviceDirectoryAccessRecovery';
import { useFileSystem } from '@entity/mountedDirectories';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
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
const recoveryErrors = ref<unknown[]>([]);

const canEditDirectoryContents = computed(() => directoryStat.value?.capabilities?.canEditChildren);

const { createDirectory } = useFileSystem();
const { grantAccess, grantDisabled, isGrantLoading, recoveryState, recoveryMessage } =
  useDeviceDirectoryAccessRecovery({
    errors: recoveryErrors,
    mode: 'readwrite',
    deniedMessage:
      'Editing is not allowed in this remembered space because your browser denied write access.',
    defaultRecoveryMessage: ({ spaceName }) =>
      `Mioframe remembers "${spaceName}", but your browser requires write access before editing it.`,
  });

const loading = ref(false);

const clearRecovery = () => {
  recoveryErrors.value = [];
};

const onApply = async () => {
  if (directoryName.value && !loading.value) {
    errorText.value = undefined;
    clearRecovery();

    if (canEditDirectoryContents.value === false) {
      errorText.value = 'Creating entries is not allowed in this directory';
      return;
    }

    try {
      loading.value = true;
      await createDirectory(PathUtils.join(path.value, directoryName.value));
      emit('created', directoryName.value);
    } catch (error) {
      if (error instanceof WebFileSystemAccessRequiredError && error.mode === 'readwrite') {
        recoveryErrors.value = [error];
        errorText.value = recoveryMessage.value;
      } else {
        errorText.value = error instanceof Error ? error.message : 'unknown error';
      }
    } finally {
      loading.value = false;
    }
  }
};

const onGrantWriteAccess = async () => {
  const result = await grantAccess();

  if (result.status === 'granted') {
    errorText.value = undefined;
    clearRecovery();
    await onApply();
    return;
  }

  errorText.value = recoveryMessage.value;
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
  clearRecovery();
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
      v-if="recoveryState"
      label="Grant write access"
      color="text"
      :disabled="grantDisabled"
      :loading="isGrantLoading"
      @click="onGrantWriteAccess"
    />
  </MDDialog>
</template>
