<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { MDExtendedFab, MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { useFSNodeStat } from '@entity/fsEntry';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { zodQuery } from './model';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { FSEntryManageMenuButton } from '@feature/entryManage';
import { RepositoryExplorerWidget } from '@widget/RepositoryExplorerWidget';
import { DocumentAddSheet } from '@feature/documentAdd';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { ImportDocumentErrorCode, useImportDocument } from '@feature/importDocument';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import { nextTick } from 'vue';

// eslint-disable-next-line vue/define-props-declaration -- z.infer output is too complex for Vue macro runtime inference
const props = defineProps(zodToVueProps(zodQuery));

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { repoPath: directoryPath } = toRefs(props);

const createDirectoryParentPath = ref<string>();

const onClickCreateDirectory = () => {
  createDirectoryParentPath.value = directoryPath.value;
};

const onCloseCreateDirectoryDialog = () => {
  createDirectoryParentPath.value = undefined;
};

const { data: directoryStat } = useFSNodeStat(directoryPath);

const { open } = useStackNavigation();

const onClickPath = async (path: string) => {
  await open('repo', {
    repoPath: path,
  });
};

const showDocumentAddSheet = ref(false);
const showCreateDocumentDialog = ref(false);
const { importJsonFile } = useImportDocument();
const { addSnackbar } = useSnackbar();

const onClickAddDocument = () => {
  showDocumentAddSheet.value = true;
};

const onCloseDocumentAddSheet = () => {
  showDocumentAddSheet.value = false;
};

const onSelectCreateDocument = async () => {
  await nextTick();
  showCreateDocumentDialog.value = true;
};

const onCloseCreateDocumentDialog = () => {
  showCreateDocumentDialog.value = false;
};

const shouldSkipImportErrorReport = (error: unknown) =>
  error instanceof DomainError &&
  (error.code === ImportDocumentErrorCode.invalidJson ||
    error.code === ImportDocumentErrorCode.invalidDocumentFormat);

const onSelectImportDocument = async () => {
  await nextTick();

  try {
    const documentId = await importJsonFile(directoryPath.value);

    if (!documentId) {
      return;
    }

    addSnackbar({ text: 'Document imported' });
  } catch (error) {
    addSnackbar({
      text: error instanceof DomainError ? error.message : 'Could not import the document',
    });

    if (!shouldSkipImportErrorReport(error)) {
      reportHandledError(error, {
        feature: 'documentImport',
        action: 'importDocumentJson',
      });
    }
  }
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
</script>

<template>
  <MDPane>
    <MDAppBar v-if="title" :headline="title">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <FSEntryManageMenuButton :path="directoryPath" />
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <RepositoryExplorerWidget
      :directory-path="directoryPath"
      @click-path="onClickPath"
      @click-document="onClickDocument"
      @click-return-home="onClickReturnHome"
    >
      <template v-if="canEditDirectoryContents" #after>
        <MDFabContainer auto-hide>
          <MDExtendedFab
            tooltip="Add document"
            label="Add"
            color="primary"
            md-symbol="add"
            @click="onClickAddDocument"
          />

          <MDFab tooltip="Create directory" color="tonal-primary" @click="onClickCreateDirectory">
            <template #icon>
              <MDSymbol name="create_new_folder" />
            </template>
          </MDFab>
        </MDFabContainer>
      </template>
    </RepositoryExplorerWidget>

    <DocumentAddSheet
      v-if="showDocumentAddSheet"
      @close="onCloseDocumentAddSheet"
      @select-create="onSelectCreateDocument"
      @select-import="onSelectImportDocument"
    />

    <DocumentCreationDialog
      v-if="directoryPath && showCreateDocumentDialog"
      :path="directoryPath"
      @cancel="onCloseCreateDocumentDialog"
      @created="onCloseCreateDocumentDialog"
    />

    <DirectoryCreateDialog
      v-if="createDirectoryParentPath"
      :path="createDirectoryParentPath"
      @cancel="onCloseCreateDirectoryDialog"
      @created="onCloseCreateDirectoryDialog"
    />
  </MDPane>
</template>
