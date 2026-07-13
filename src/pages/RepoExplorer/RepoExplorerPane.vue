<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { EntryAddSheet } from '@feature/entryAdd';
import { useFSEntryManageActions, useEntryManageDialogState } from '@feature/entryManage';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { ExportZipDialog, useExportDirectoryZip } from '@feature/exportZip';
import type { ExportZipVisibleDialogState } from '@feature/exportZip';
import { ImportZipDialog, useImportZipAction } from '@feature/importZip';
import type { ImportZipVisibleDialogState } from '@feature/importZip';
import { useFSNodeStat } from '@entity/fsEntry';
import { FabContainer, MDExtendedFab } from '@shared/ui/Button';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
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

const { data: directoryStat } = useFSNodeStat(directoryPath);
const directoryCanEditChildren = computed(() => directoryStat.value?.capabilities?.canEditChildren);
const directoryCanChangePath = computed(() => directoryStat.value?.capabilities?.canChangePath);
const directoryCanDelete = computed(() => directoryStat.value?.capabilities?.canDelete);
const { hasActions: hasDirectoryManageActions, nonEmptyActionButtons: directoryManageActions } =
  useFSEntryManageActions({
    entryType: computed(() => FSNodeType.Directory),
    canEditChildren: directoryCanEditChildren,
    canChangePath: directoryCanChangePath,
    canDelete: directoryCanDelete,
    // Document creation stays in the Add sheet/FAB; import actions belong to this directory's
    // own context menu, not to document-creation gating.
    showCreateDocumentAction: computed(() => false),
    showImportActions: computed(() => true),
  });

const {
  showRenameDialog: showDirectoryRenameDialog,
  onSelectRename: onManageSelectRename,
  onCloseRenameDialog: onCloseDirectoryRenameDialog,
} = useEntryManageDialogState(directoryPath);

const { remove } = useRemoveFSEntry();
const { exportDirectoryZip, state: exportZipState, closeExportZipDialog } = useExportDirectoryZip();
const {
  importDirectoryZip,
  state: importZipState,
  closeImportZipDialog,
  invalidateImportZipContext,
} = useImportZipAction();

const exportZipVisibleState = computed<ExportZipVisibleDialogState | null>(() =>
  exportZipState.value.status === 'idle' ? null : exportZipState.value,
);
const importZipVisibleState = computed<ImportZipVisibleDialogState | null>(() =>
  importZipState.value.status === 'idle' ? null : importZipState.value,
);

const onManageSelectRemove = async () => {
  await remove(directoryPath.value);
};
const onSelectExportZip = async () => {
  await exportDirectoryZip(directoryPath.value);
};
const onSelectImportZip = async () => {
  await importDirectoryZip(directoryPath.value);
};
const onManageSelectImportJson = async () => {
  await importDocument(directoryPath.value);
};

watch(directoryPath, () => {
  showEntryAddSheet.value = false;
  showCreateDirectoryDialog.value = false;
  showCreateDocumentDialog.value = false;
  invalidateImportZipContext();
});

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

const onClickReturnHome = async () => {
  await open('home', {}, { additionalPanes: 0, replace: true });
};
</script>

<template>
  <MDPane>
    <template #topBar>
      <MDAppBar v-if="title" :headline="title">
        <template #leadingButton>
          <slot name="navigationButton" />
        </template>

        <template #trailingElements>
          <slot name="appBarTrailing" />

          <RepositoryExplorerEntryManageButton
            v-if="hasDirectoryManageActions && directoryManageActions"
            :key="directoryPath"
            :path="directoryPath"
            :actions="directoryManageActions"
            @select-create-directory="onSelectCreateDirectory"
            @select-rename="onManageSelectRename"
            @select-remove="onManageSelectRemove"
            @select-export-zip="onSelectExportZip"
            @select-import-json="onManageSelectImportJson"
            @select-import-zip="onSelectImportZip"
          />
        </template>
      </MDAppBar>
    </template>

    <RepositoryExplorerWidget
      :directory-path="directoryPath"
      @click-path="onClickPath"
      @click-document="onClickDocument"
      @click-return-home="onClickReturnHome"
    >
      <template #after="{ canEditDirectoryContents }">
        <FabContainer v-if="canEditDirectoryContents !== false" auto-hide>
          <MDExtendedFab label="Add" md-symbol="add" @click="onClickAdd" />
        </FabContainer>
      </template>
    </RepositoryExplorerWidget>

    <EntryAddSheet
      v-if="showEntryAddSheet"
      @close="onCloseEntryAddSheet"
      @select-create-directory="onSelectCreateDirectory"
      @select-create-document="onSelectCreateDocument"
      @select-import-document="onSelectImportDocument"
    />

    <ExportZipDialog
      v-if="exportZipVisibleState"
      :state="exportZipVisibleState"
      @close="closeExportZipDialog"
    />

    <ImportZipDialog
      v-if="importZipVisibleState"
      :state="importZipVisibleState"
      @close="closeImportZipDialog"
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

    <FSEntryRenameDialog
      v-if="showDirectoryRenameDialog"
      :path="directoryPath"
      @cancel="onCloseDirectoryRenameDialog"
      @renamed="onCloseDirectoryRenameDialog"
    />
  </MDPane>
</template>
