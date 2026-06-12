<script setup lang="ts">
import { FSEntryManageMenuButton, useFSEntryManageActions } from '@feature/entryManage';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { useImportDocumentAction } from '@feature/importDocument';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { ref, toRefs, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    path: string;
    entryType: FSNodeType;
    canEditChildren?: boolean | undefined;
    canChangePath?: boolean | undefined;
    canDelete?: boolean | undefined;
    showDocumentActions?: boolean | undefined;
  }>(),
  {
    showDocumentActions: false,
  },
);

const { path, entryType, canEditChildren, canChangePath, canDelete, showDocumentActions } =
  toRefs(props);

const { importDocument } = useImportDocumentAction();
const { remove } = useRemoveFSEntry();

const showCreateDirectoryDialog = ref(false);
const showCreateDocumentDialog = ref(false);
const showRenameDialog = ref(false);

const { actionButtons } = useFSEntryManageActions({
  entryType,
  canEditChildren,
  canChangePath,
  canDelete,
  showDocumentActions,
});

watch(path, () => {
  showCreateDirectoryDialog.value = false;
  showCreateDocumentDialog.value = false;
  showRenameDialog.value = false;
});

const onCloseCreateDirectoryDialog = () => {
  showCreateDirectoryDialog.value = false;
};

const onCloseCreateDocumentDialog = () => {
  showCreateDocumentDialog.value = false;
};

const onCloseRenameDialog = () => {
  showRenameDialog.value = false;
};

const onSelectCreateDirectory = () => {
  showCreateDirectoryDialog.value = true;
};

const onSelectCreateDocument = () => {
  showCreateDocumentDialog.value = true;
};

const onSelectRename = () => {
  showRenameDialog.value = true;
};

const onSelectRemove = async () => {
  await remove(path.value);
};

const onSelectImportJson = async () => {
  await importDocument(path.value);
};
</script>

<template>
  <FSEntryManageMenuButton
    :path="path"
    :actions="actionButtons"
    @select-create-directory="onSelectCreateDirectory"
    @select-create-document="onSelectCreateDocument"
    @select-rename="onSelectRename"
    @select-remove="onSelectRemove"
    @select-import-json="onSelectImportJson"
  />

  <DirectoryCreateDialog
    v-if="showCreateDirectoryDialog"
    :path="path"
    @cancel="onCloseCreateDirectoryDialog"
    @created="onCloseCreateDirectoryDialog"
  />

  <DocumentCreationDialog
    v-if="showCreateDocumentDialog"
    :path="path"
    @cancel="onCloseCreateDocumentDialog"
    @created="onCloseCreateDocumentDialog"
  />

  <FSEntryRenameDialog
    v-if="showRenameDialog"
    :path="path"
    @cancel="onCloseRenameDialog"
    @renamed="onCloseRenameDialog"
  />
</template>
