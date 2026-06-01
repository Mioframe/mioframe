<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { useDeviceDirectoryAccessRecovery } from '@feature/deviceDirectoryAccessRecovery';
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { MDButton } from '@shared/ui/Button';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import { useRepository } from '@entity/repository';
import { strictRecordGet } from '@shared/lib/strictRecord';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const props = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const { path } = toRefs(props);

const stateName = ref<string>();
const errorText = ref<string>();
const loading = ref(false);
const recoveryErrors = ref<unknown[]>([]);

const { createDocument } = useRepository(path);
const { data: directoryStat } = useFSNodeStat(path);

const canEditDirectoryContents = computed(() => directoryStat.value?.capabilities?.canEditChildren);
const { grantAccess, grantDisabled, isGrantLoading, recoveryState, recoveryMessage } =
  useDeviceDirectoryAccessRecovery({
    errors: recoveryErrors,
    mode: 'readwrite',
    deniedMessage:
      'Editing is not allowed in this remembered space because your browser denied write access.',
    defaultRecoveryMessage: ({ spaceName }) =>
      `Mioframe remembers "${spaceName}", but your browser requires write access before editing it.`,
  });

const clearRecovery = () => {
  recoveryErrors.value = [];
};

const onCreate = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  errorText.value = undefined;
  clearRecovery();

  if (canEditDirectoryContents.value === false) {
    errorText.value = 'Creating entries is not allowed in this directory';
    return;
  }

  if (selectedDocumentType.value) {
    try {
      loading.value = true;
      await createDocument({
        name: stateName.value.trim(),
        type: selectedDocumentType.value,
        version: 1,
        body: {},
      });
    } catch (error) {
      if (error instanceof WebFileSystemAccessRequiredError && error.mode === 'readwrite') {
        recoveryErrors.value = [error];
        errorText.value = recoveryMessage.value;
      } else {
        errorText.value = error instanceof Error ? error.message : 'unknown error';
      }
      return;
    } finally {
      loading.value = false;
    }

    emit('created');
  }
};

const onGrantWriteAccess = async () => {
  const result = await grantAccess();

  if (result.status === 'granted') {
    errorText.value = undefined;
    clearRecovery();
    await onCreate();
    return;
  }

  errorText.value = recoveryMessage.value;
};

const onCancel = () => {
  stateName.value = undefined;
  errorText.value = undefined;
  clearRecovery();
  emit('cancel');
};

const documentTypes = {
  [DATABASE_DOCUMENT_TYPE]: 'Database',
  JsonObject: 'JSON Object',
};

const selectedDocumentTypes = ref<(keyof typeof documentTypes)[]>([DATABASE_DOCUMENT_TYPE]);

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
    headline="Create Document"
    supporting-text="Think of a name and select the type of the new document."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    :loading="loading"
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="stateName"
      label-text="Name"
      :error="!!errorText"
      :supporting-text="errorText"
      autofocus
    />

    <MDButton
      v-if="recoveryState"
      label="Grant write access"
      color="text"
      :disabled="grantDisabled"
      :loading="isGrantLoading"
      @click="onGrantWriteAccess"
    />

    <MDSelectBase v-model:model-value="selectedDocumentTypes" label-text="Document type">
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
