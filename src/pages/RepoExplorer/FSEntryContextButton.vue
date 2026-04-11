<script setup lang="ts">
import { useDirectory } from '@entity/directory/useDirectory';
import { useFSNodeStat } from '@entity/fsEntry';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { useImportDocument } from '@feature/importDocument';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { defineMenuButton } from '@shared/ui/Menu/defineMenuButtonList';
import { computed, shallowRef, toRefs } from 'vue';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

enum FSEntryContextEvent {
  createDirectory,
  createDocument,
  remove,
  rename,
  importJson,
}

const createDirectoryBtn = defineMenuButton({
  label: 'Create directory',
  symbolName: 'create_new_folder',
  key: FSEntryContextEvent.createDirectory,
});

const createDocumentBtn = defineMenuButton({
  label: 'Create document',
  symbolName: 'edit_document',
  key: FSEntryContextEvent.createDocument,
});

const renameBtn = defineMenuButton({
  label: 'Rename',
  symbolName: 'edit',
  key: FSEntryContextEvent.rename,
});

const removeBtn = defineMenuButton({
  label: 'Remove',
  symbolName: 'delete',
  key: FSEntryContextEvent.remove,
});

const importJsonBtn = defineMenuButton({
  label: 'Import JSON',
  symbolName: 'file_copy',
  key: FSEntryContextEvent.importJson,
});

const { data: fsEntryStat } = useFSNodeStat(path);

const directoryContextBtns = defineMenuButtonList([
  createDirectoryBtn,
  createDocumentBtn,
  renameBtn,
  importJsonBtn,
  removeBtn,
]);

const fileContextBtns = defineMenuButtonList([renameBtn, removeBtn]);

const parentPath = computed(() => PathUtils.dirname(path.value));

const fsEntryName = computed(() => PathUtils.basename(path.value));

const { data: parentData } = useDirectory(parentPath);

const fileType = computed(
  () => parentData.value?.find(([name]) => name === fsEntryName.value)?.[1].type,
);

const contextBtns = computed(() => {
  const buttonList =
    fileType.value === FSNodeType.Directory ? directoryContextBtns : fileContextBtns;

  return buttonList.filter(({ key }) => {
    switch (key) {
      case FSEntryContextEvent.createDirectory:
      case FSEntryContextEvent.createDocument:
      case FSEntryContextEvent.importJson:
        return fsEntryStat.value?.capabilities?.canEditChildren;
      case FSEntryContextEvent.remove:
        return fsEntryStat.value?.capabilities?.canDelete;
      case FSEntryContextEvent.rename:
        return fsEntryStat.value?.capabilities?.canChangePath;
      default:
        return true;
    }
  });
});

const { remove: removeEntry } = useRemoveFSEntry();

const showCreateDirectoryDialog = shallowRef(false);
const showCreateDocumentDialog = shallowRef(false);
const showRenameDialog = shallowRef(false);

const { importJsonFile } = useImportDocument();

const onClickFSEntryContextAction = async ({ key }: { key: FSEntryContextEvent }) => {
  switch (key) {
    case FSEntryContextEvent.createDirectory: {
      if (fileType.value === FSNodeType.Directory) {
        showCreateDirectoryDialog.value = true;
      }
      break;
    }
    case FSEntryContextEvent.createDocument: {
      if (fileType.value === FSNodeType.Directory) {
        showCreateDocumentDialog.value = true;
      }
      break;
    }
    case FSEntryContextEvent.remove: {
      await removeEntry(path.value);
      break;
    }
    case FSEntryContextEvent.rename: {
      showRenameDialog.value = true;
      break;
    }
    case FSEntryContextEvent.importJson: {
      if (fileType.value === FSNodeType.Directory) {
        await importJsonFile(path.value);
      }
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

const onRenamedEntry = () => {
  showRenameDialog.value = false;
};

const tooltip = computed(() => `options ${fsEntryName.value}`);
</script>

<template>
  <MDContextMenuButton
    :btns="contextBtns"
    :tooltip="tooltip"
    @click="onClickFSEntryContextAction"
  />

  <FSEntryRenameDialog
    v-if="showRenameDialog"
    :path="path"
    @cancel="showRenameDialog = false"
    @renamed="onRenamedEntry"
  />

  <DocumentCreationDialog
    v-if="showCreateDocumentDialog"
    :path="path"
    @cancel="showCreateDocumentDialog = false"
    @created="showCreateDocumentDialog = false"
  />

  <DirectoryCreateDialog
    v-if="showCreateDirectoryDialog"
    :path="path"
    @cancel="showCreateDirectoryDialog = false"
    @created="showCreateDirectoryDialog = false"
  />
</template>
