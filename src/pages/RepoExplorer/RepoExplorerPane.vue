<script setup lang="ts">
import { computed, nextTick, ref, toRefs } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { useDeviceDirectoryAccessRecovery } from '@feature/deviceDirectoryAccessRecovery';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { EntryAddSheet } from '@feature/entryAdd';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { MDExtendedFab, MDFabContainer } from '@shared/ui/Button';
import { DeviceDirectoryAccessRecoveryState } from '@entity/deviceDirectoryAccess';
import { useFSNodeStat } from '@entity/fsEntry';
import {
  getGoogleDriveAccessRecoveryError,
  GoogleDriveAccessRecoveryState,
} from '@entity/googleDriveAccess';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { zodQuery } from './model';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { MDButton } from '@shared/ui/Button';
import {
  RepositoryExplorerEntryManageButton,
  RepositoryExplorerWidget,
  useRepositoryExplorerDirectoryState,
} from '@widget/RepositoryExplorerWidget';
import { useImportDocumentAction } from '@feature/importDocument';

// eslint-disable-next-line vue/define-props-declaration -- z.infer output is too complex for Vue macro runtime inference
const props = defineProps(zodToVueProps(zodQuery));

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { repoPath: directoryPath } = toRefs(props);

const { data: directoryStat, error: directoryStatError } = useFSNodeStat(directoryPath);
const repositoryExplorerDirectoryState = useRepositoryExplorerDirectoryState(directoryPath);
const {
  documentIds,
  errorMessage,
  hideAutomergeFiles,
  isLoading,
  isRepositoryInitialized,
  regularFileEntries,
} = repositoryExplorerDirectoryState;
const recoveryErrors = computed(() => [
  ...repositoryExplorerDirectoryState.recoveryErrors.value,
  directoryStatError.value,
]);
const {
  grantAccess,
  grantDisabled: isDeviceDirectoryAccessGrantDisabled,
  isGrantLoading: isGrantDeviceDirectoryAccessLoading,
  message: deviceDirectoryAccessMessage,
  recoveryState: deviceDirectoryAccessRecovery,
} = useDeviceDirectoryAccessRecovery({
  errors: recoveryErrors,
});
const hasGoogleDriveRecovery = computed(
  () =>
    !!errorMessage.value &&
    !!getGoogleDriveAccessRecoveryError(directoryPath.value, recoveryErrors.value),
);
const { isRetryAuthorizationLoading, onRetryAuthorization } = useGoogleDriveRecovery({
  path: directoryPath,
});
const isRecoveryStateVisible = computed(
  () => !!deviceDirectoryAccessRecovery.value || hasGoogleDriveRecovery.value,
);

const { open } = useStackNavigation();

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

const onClickReturnHome = async () => {
  await open('home', {}, { additionalPanes: 0, replace: true });
};

const onGrantDeviceDirectoryAccess = async () => {
  const result = await grantAccess();

  if (result.status === 'granted') {
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
      :document-ids="documentIds"
      :error-message="errorMessage"
      :hide-automerge-files="hideAutomergeFiles"
      :is-loading="isLoading"
      :is-recovery-state-visible="isRecoveryStateVisible"
      :is-repository-initialized="isRepositoryInitialized"
      :regular-file-entries="regularFileEntries"
      @click-path="onClickPath"
      @click-document="onClickDocument"
      @click-return-home="onClickReturnHome"
    >
      <template #recovery>
        <DeviceDirectoryAccessRecoveryState
          v-if="deviceDirectoryAccessRecovery"
          :errors="recoveryErrors"
          :message="deviceDirectoryAccessMessage"
        >
          <template #actions>
            <MDButton
              label="Grant access"
              :disabled="isDeviceDirectoryAccessGrantDisabled"
              :loading="isGrantDeviceDirectoryAccessLoading"
              @click="onGrantDeviceDirectoryAccess"
            />

            <MDButton label="Cancel" color="text" @click="onCancelDeviceDirectoryAccess" />
          </template>
        </DeviceDirectoryAccessRecoveryState>

        <GoogleDriveAccessRecoveryState v-else :path="directoryPath" :errors="recoveryErrors">
          <template #actions>
            <MDButton
              label="Retry authorization"
              :loading="isRetryAuthorizationLoading"
              @click="onRetryAuthorization"
            />

            <MDButton label="Return home" color="text" @click="onClickReturnHome" />
          </template>
        </GoogleDriveAccessRecoveryState>
      </template>

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
