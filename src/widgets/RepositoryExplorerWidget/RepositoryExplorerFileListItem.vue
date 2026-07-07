<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useFSEntryManageActions, useEntryManageDialogState } from '@feature/entryManage';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { ExportZipProgressSheet } from '@feature/exportZip';
import { ImportZipProgressSheet } from '@feature/importZip';
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
  exportZipProgress,
  isExportZipRunning,
  importZipProgress,
  isImportZipRunning,
  onSelectCreateDirectory,
  onSelectCreateDocument,
  onSelectRename,
  onSelectRemove,
  onSelectImportJson,
  onSelectExportZip,
  onSelectImportZip,
  onCloseExportZipProgressSheet,
  onCloseImportZipProgressSheet,
  onCloseCreateDirectoryDialog,
  onCloseCreateDocumentDialog,
  onCloseRenameDialog,
} = useEntryManageDialogState(entryPath);

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

      <ExportZipProgressSheet
        v-if="isExportZipRunning"
        :progress="exportZipProgress"
        @close="onCloseExportZipProgressSheet"
      />

      <ImportZipProgressSheet
        v-if="isImportZipRunning"
        :progress="importZipProgress"
        @close="onCloseImportZipProgressSheet"
      />
    </template>
  </FSEntryMDListItem>
</template>
