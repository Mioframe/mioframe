<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { EntryAddSheet } from '@feature/entryAdd';
import { MDExtendedFab, MDFabContainer } from '@shared/ui/Button';
import { useFSNodeStat } from '@entity/fsEntry';
import { useLocalSettings } from '@entity/localSettings';
import { useRepository } from '@entity/repository';
import { useDeviceDirectoryAccessRecoveryState } from '@entity/deviceDirectoryAccess';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { useMainServiceClient } from '@shared/service';
import { zodQuery } from './model';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import {
  RepositoryExplorerEntryManageButton,
  RepositoryExplorerWidget,
} from '@widget/RepositoryExplorerWidget';
import { useImportDocumentAction } from '@feature/importDocument';

// eslint-disable-next-line vue/define-props-declaration -- z.infer output is too complex for Vue macro runtime inference
const props = defineProps(zodToVueProps(zodQuery));

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { repoPath: directoryPath } = toRefs(props);

const { data: directoryStat } = useFSNodeStat(directoryPath);
const { settings } = useLocalSettings();
const { repositoryFactsError, repositoryVisibleEntriesError } = useRepository(
  directoryPath,
  computed(() => ({
    hideAutomergeFiles: settings.value.showAutomergeFiles !== true,
  })),
);
const recoveryErrors = computed(() => [
  repositoryVisibleEntriesError.value,
  repositoryFactsError.value,
]);
const { state: deviceDirectoryAccessRecovery } = useDeviceDirectoryAccessRecoveryState({
  errors: recoveryErrors,
});

const { open } = useStackNavigation();
const {
  fileSystem: { getDeviceDirectoryAccessRequest, resolveDeviceDirectoryAccessRequest },
} = useMainServiceClient();

const onClickPath = async (path: string) => {
  await open('repo', {
    repoPath: path,
  });
};

const showEntryAddSheet = ref(false);
const showCreateDirectoryDialog = ref(false);
const showCreateDocumentDialog = ref(false);
const { importDocument } = useImportDocumentAction();

const onClickAdd = () => {
  showEntryAddSheet.value = true;
};

const onCloseEntryAddSheet = () => {
  showEntryAddSheet.value = false;
};

const onSelectCreateDirectory = async () => {
  await nextTick();
  showCreateDirectoryDialog.value = true;
};

const onSelectCreateDocument = async () => {
  await nextTick();
  showCreateDocumentDialog.value = true;
};

const onCloseCreateDocumentDialog = () => {
  showCreateDocumentDialog.value = false;
};

const onCloseCreateDirectoryDialog = () => {
  showCreateDirectoryDialog.value = false;
};

const onSelectImportDocument = async () => {
  await nextTick();
  await importDocument(directoryPath.value);
};

const onClickDocument = async (documentId: AMDocumentId) => {
  await open(
    'document',
    {
      documentDirectory: directoryPath.value,
      documentId,
    },
    {
      target: 'document',
    },
  );
};

const title = computed(() => PathUtils.basename(directoryPath.value) || 'root');

const canEditDirectoryContents = computed(
  () => directoryStat.value?.capabilities?.canEditChildren === true,
);
const deviceDirectoryAccessRequest = ref<
  | {
      id: string;
      name: string;
      handle: FileSystemDirectoryHandle;
      mode: 'readwrite';
    }
  | undefined
>();
const isGrantDeviceDirectoryAccessLoading = ref(false);
const deviceDirectoryAccessMessage = ref<string>();

watch(
  () => deviceDirectoryAccessRecovery.value?.requestId,
  async (requestId) => {
    deviceDirectoryAccessRequest.value = undefined;
    deviceDirectoryAccessMessage.value = undefined;

    if (!requestId) {
      return;
    }

    deviceDirectoryAccessRequest.value = await getDeviceDirectoryAccessRequest(requestId);
  },
  { immediate: true },
);

const onClickReturnHome = async () => {
  await open('home', {}, { additionalPanes: 0, replace: true });
};

const onGrantDeviceDirectoryAccess = async () => {
  const accessRequest = deviceDirectoryAccessRequest.value;

  if (!accessRequest || isGrantDeviceDirectoryAccessLoading.value) {
    return;
  }

  isGrantDeviceDirectoryAccessLoading.value = true;

  try {
    const permissionState = await accessRequest.handle.requestPermission({
      mode: accessRequest.mode,
    });

    await resolveDeviceDirectoryAccessRequest({
      id: accessRequest.id,
      permissionState,
    });

    if (permissionState === 'granted') {
      deviceDirectoryAccessMessage.value = undefined;
      await open(
        'repo',
        {
          repoPath: directoryPath.value,
        },
        {
          replace: true,
          target: 'current',
        },
      );
      return;
    }

    deviceDirectoryAccessMessage.value =
      'Mioframe still cannot open this space because your browser did not grant permission.';
  } finally {
    isGrantDeviceDirectoryAccessLoading.value = false;
  }
};

const onCancelDeviceDirectoryAccess = async () => {
  await open('home', {}, { additionalPanes: 0, replace: true });
};
</script>

<template>
  <MDPane>
    <MDAppBar v-if="title" :headline="title">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <RepositoryExplorerEntryManageButton
          :path="directoryPath"
          :entry-type="FSNodeType.Directory"
        />

        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <RepositoryExplorerWidget
      :directory-path="directoryPath"
      :device-directory-access-grant-disabled="!deviceDirectoryAccessRequest"
      :device-directory-access-grant-loading="isGrantDeviceDirectoryAccessLoading"
      :device-directory-access-message="deviceDirectoryAccessMessage"
      @click-path="onClickPath"
      @click-document="onClickDocument"
      @click-return-home="onClickReturnHome"
      @grant-device-directory-access="onGrantDeviceDirectoryAccess"
      @cancel-device-directory-access="onCancelDeviceDirectoryAccess"
    >
      <template v-if="canEditDirectoryContents" #after>
        <MDFabContainer auto-hide>
          <MDExtendedFab label="Add" md-symbol="add" @click="onClickAdd" />
        </MDFabContainer>
      </template>
    </RepositoryExplorerWidget>

    <EntryAddSheet
      v-if="showEntryAddSheet"
      @close="onCloseEntryAddSheet"
      @select-create-directory="onSelectCreateDirectory"
      @select-create-document="onSelectCreateDocument"
      @select-import-document="onSelectImportDocument"
    />

    <DirectoryCreateDialog
      v-if="showCreateDirectoryDialog"
      :path="directoryPath"
      @cancel="onCloseCreateDirectoryDialog"
      @created="onCloseCreateDirectoryDialog"
    />

    <DocumentCreationDialog
      v-if="showCreateDocumentDialog"
      :path="directoryPath"
      @cancel="onCloseCreateDocumentDialog"
      @created="onCloseCreateDocumentDialog"
    />
  </MDPane>
</template>
