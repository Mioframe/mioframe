<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import { getFileSystemAccessRecovery, type FileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import { useRepository } from '@entity/repository';
import { strictRecordGet } from '@shared/lib/strictRecord';
import { useDialog } from '@shared/ui/Dialog';

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

const { createDocument } = useRepository(path);
const { data: directoryStat } = useFSNodeStat(path);
const { confirm } = useDialog();
const { requestAccess } = useFileSystemAccessPermissionBroker();

const canEditDirectoryContents = computed(() => directoryStat.value?.capabilities?.canEditChildren);

const createRepositoryDocument = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  if (!selectedDocumentType.value) {
    return;
  }

  await createDocument({
    name: stateName.value.trim(),
    type: selectedDocumentType.value,
    version: 1,
    body: {},
  });
};

const requestWriteAccess = async (recovery: FileSystemAccessRecovery) => {
  const shouldGrantAccess = await confirm({
    headline: 'Grant write access',
    supportingText: `Mioframe remembers "${recovery.spaceName}", but your browser requires write access before creating a document in it.`,
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

const onCreate = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  errorText.value = undefined;

  if (canEditDirectoryContents.value === false) {
    errorText.value = 'Creating entries is not allowed in this directory';
    return;
  }

  if (selectedDocumentType.value) {
    try {
      loading.value = true;
      await createRepositoryDocument();
    } catch (error) {
      const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });
      if (recovery) {
        if (await requestWriteAccess(recovery)) {
          await createRepositoryDocument();
          emit('created');
        }
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

const onCancel = () => {
  stateName.value = undefined;
  errorText.value = undefined;
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
