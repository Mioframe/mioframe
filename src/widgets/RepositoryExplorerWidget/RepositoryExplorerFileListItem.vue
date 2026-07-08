<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useFSEntryManageActions, useEntryManageDialogState } from '@feature/entryManage';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { ExportZipDialog, useExportDirectoryZip } from '@feature/exportZip';
import type { ExportZipVisibleDialogState } from '@feature/exportZip';
import { ImportZipDialog, useImportZipAction } from '@feature/importZip';
import type { ImportZipVisibleDialogState } from '@feature/importZip';
import { useImportDocumentAction } from '@feature/importDocument';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { computed, toRef } from 'vue';
import RepositoryExplorerEntryManageButton from './RepositoryExplorerEntryManageButton.vue';

const props = defineProps<{
  directoryPath: string;
  name: string;
  description?: string | undefined;
  entryType: FSNodeType;
  canEditChildren?: boolean | undefined;
  canChangePath?: boolean | undefined;
  canDelete?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [name: string];
}>();

const showDocumentActions = computed(() => props.entryType === FSNodeType.Directory);

const { hasActions, nonEmptyActionButtons } = useFSEntryManageActions({
  entryType: toRef(props, 'entryType'),
  canEditChildren: toRef(props, 'canEditChildren'),
  canChangePath: toRef(props, 'canChangePath'),
  canDelete: toRef(props, 'canDelete'),
  showDocumentActions,
});

const entryPath = computed(() => PathUtils.join(props.directoryPath, props.name));

const {
  showCreateDirectoryDialog,
  showCreateDocumentDialog,
  showRenameDialog,
  onSelectCreateDirectory,
  onSelectCreateDocument,
  onSelectRename,
  onCloseCreateDirectoryDialog,
  onCloseCreateDocumentDialog,
  onCloseRenameDialog,
} = useEntryManageDialogState(entryPath);

const { remove } = useRemoveFSEntry();
const { importDocument } = useImportDocumentAction();
const { exportDirectoryZip, state: exportZipState, closeExportZipDialog } = useExportDirectoryZip();
const { importDirectoryZip, state: importZipState, closeImportZipDialog } = useImportZipAction();

const exportZipVisibleState = computed<ExportZipVisibleDialogState | null>(() =>
  exportZipState.value.status === 'idle' ? null : exportZipState.value,
);
const importZipVisibleState = computed<ImportZipVisibleDialogState | null>(() =>
  importZipState.value.status === 'idle' ? null : importZipState.value,
);

const onSelectRemove = async () => {
  await remove(entryPath.value);
};
const onSelectImportJson = async () => {
  await importDocument(entryPath.value);
};
const onSelectExportZip = async () => {
  await exportDirectoryZip(entryPath.value);
};
const onSelectImportZip = async () => {
  await importDirectoryZip(entryPath.value);
};

const onClickEntry = (name: string) => {
  emit('click', name);
};
</script>

<template>
  <FSEntryMDListItem
    :is-openable="
      entryType === FSNodeType.Directory ||
      (entryType === FSNodeType.File && name.toLowerCase().endsWith('.json'))
    "
    :name="name"
    :supporting-text="description"
    :type="entryType"
    class="repository-explorer-file-list-item"
    @click="onClickEntry"
  >
    <template v-if="hasActions" #trailingAction>
      <RepositoryExplorerEntryManageButton
        v-if="nonEmptyActionButtons"
        :path="entryPath"
        :actions="nonEmptyActionButtons"
        @select-create-directory="onSelectCreateDirectory"
        @select-create-document="onSelectCreateDocument"
        @select-rename="onSelectRename"
        @select-remove="onSelectRemove"
        @select-import-json="onSelectImportJson"
        @select-export-zip="onSelectExportZip"
        @select-import-zip="onSelectImportZip"
      />

      <!-- Dialogs use TeleportContainer internally; DOM output goes to the dialog container, not into the list item. -->
      <DirectoryCreateDialog
        v-if="showCreateDirectoryDialog"
        :path="entryPath"
        @cancel="onCloseCreateDirectoryDialog"
        @created="onCloseCreateDirectoryDialog"
      />

      <DocumentCreationDialog
        v-if="showCreateDocumentDialog"
        :path="entryPath"
        @cancel="onCloseCreateDocumentDialog"
        @created="onCloseCreateDocumentDialog"
      />

      <FSEntryRenameDialog
        v-if="showRenameDialog"
        :path="entryPath"
        @cancel="onCloseRenameDialog"
        @renamed="onCloseRenameDialog"
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
    </template>
  </FSEntryMDListItem>
</template>
