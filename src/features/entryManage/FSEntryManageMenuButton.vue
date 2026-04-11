<script setup lang="ts">
import { useDirectory } from '@entity/directory/useDirectory';
import { useFSNodeStat } from '@entity/fsEntry';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { useImportDocument } from '@feature/importDocument';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
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

const createDirectoryButton = defineMenuButton({
  label: 'Create directory',
  symbolName: 'create_new_folder',
  key: FSEntryContextEvent.createDirectory,
});

const createDocumentButton = defineMenuButton({
  label: 'Create document',
  symbolName: 'edit_document',
  key: FSEntryContextEvent.createDocument,
});

const renameButton = defineMenuButton({
  label: 'Rename',
  symbolName: 'edit',
  key: FSEntryContextEvent.rename,
});

const removeButton = defineMenuButton({
  label: 'Remove',
  symbolName: 'delete',
  key: FSEntryContextEvent.remove,
});

const importJsonButton = defineMenuButton({
  label: 'Import JSON',
  symbolName: 'file_copy',
  key: FSEntryContextEvent.importJson,
});

const { data: fsEntryStat } = useFSNodeStat(path);

const directoryActionButtons = defineMenuButtonList([
  createDirectoryButton,
  createDocumentButton,
  renameButton,
  importJsonButton,
  removeButton,
]);

const fileActionButtons = defineMenuButtonList([renameButton, removeButton]);

const parentPath = computed(() => PathUtils.dirname(path.value));

const fsEntryName = computed(() => PathUtils.basename(path.value));

const { data: parentData } = useDirectory(parentPath);

const fileType = computed(
  () => parentData.value?.find(([name]) => name === fsEntryName.value)?.[1].type,
);

const isDirectory = computed(() => fileType.value === FSNodeType.Directory);

const canCreateInDirectory = computed(() => fsEntryStat.value?.capabilities?.canEditChildren);

const canRenameEntry = computed(() => fsEntryStat.value?.capabilities?.canChangePath);

const canRemoveEntry = computed(() => fsEntryStat.value?.capabilities?.canDelete);

const actionButtons = computed(() => {
  const buttonList = isDirectory.value ? directoryActionButtons : fileActionButtons;

  return buttonList.filter(({ key }) => {
    switch (key) {
      case FSEntryContextEvent.createDirectory:
      case FSEntryContextEvent.createDocument:
      case FSEntryContextEvent.importJson:
        return canCreateInDirectory.value;
      case FSEntryContextEvent.rename:
        return canRenameEntry.value;
      case FSEntryContextEvent.remove:
        return canRemoveEntry.value;
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

const onClickMenuAction = async ({ key }: { key: FSEntryContextEvent }) => {
  switch (key) {
    case FSEntryContextEvent.createDirectory: {
      if (isDirectory.value) {
        showCreateDirectoryDialog.value = true;
      }
      break;
    }
    case FSEntryContextEvent.createDocument: {
      if (isDirectory.value) {
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
      if (isDirectory.value) {
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

const menuTooltip = computed(() => `options ${fsEntryName.value}`);
</script>

<template>
  <MDContextMenuButton :btns="actionButtons" :tooltip="menuTooltip" @click="onClickMenuAction" />

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

  <FSEntryRenameDialog
    v-if="showRenameDialog"
    :path="path"
    @cancel="showRenameDialog = false"
    @renamed="onRenamedEntry"
  />
</template>
