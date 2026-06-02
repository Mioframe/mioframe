<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { getFileSystemAccessRecovery, type FileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { MDButton } from '@shared/ui/Button';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import { useRepository } from '@entity/repository';
import { strictRecordGet } from '@shared/lib/strictRecord';
import { useMainServiceClient } from '@shared/service';

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
const isGrantLoading = ref(false);
const writeAccessRecovery = ref<FileSystemAccessRecovery | undefined>();

const { createDocument } = useRepository(path);
const { data: directoryStat } = useFSNodeStat(path);
const {
  fileSystem: { requestFileSystemAccess },
} = useMainServiceClient();

const canEditDirectoryContents = computed(() => directoryStat.value?.capabilities?.canEditChildren);

const onCreate = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  errorText.value = undefined;
  writeAccessRecovery.value = undefined;

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
      const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });
      if (recovery) {
        writeAccessRecovery.value = recovery;
        errorText.value = `Mioframe needs write access to "${recovery.spaceName}" to create this document.`;
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
      await onCreate();
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

const onCancel = () => {
  stateName.value = undefined;
  errorText.value = undefined;
  writeAccessRecovery.value = undefined;
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
      v-if="writeAccessRecovery"
      label="Grant write access"
      color="text"
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
