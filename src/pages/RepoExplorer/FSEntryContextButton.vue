<script setup lang="ts">
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { useImportDocument } from '@feature/importDocument';
import { FileType } from '@shared/lib/virtualFileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { defineMenuButton } from '@shared/ui/Menu/defineMenuButtonList';
import { computed, shallowRef, toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  name: string;
  fileType: FileType;
}>();

const { directoryPath, name, fileType } = toRefs(props);

enum FSEntryContextEvent {
  remove,
  rename,
  importJson,
}

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

const directoryContextBtns = defineMenuButtonList([
  renameBtn,
  removeBtn,
  importJsonBtn,
]);

const fileContextBtns = defineMenuButtonList([renameBtn, removeBtn]);

const contextBtns = computed(() =>
  fileType.value === FileType.Directory
    ? directoryContextBtns
    : fileContextBtns,
);

const { remove: removeEntry } = useRemoveFSEntry();

const showRenameDialog = shallowRef(false);

const { importJsonFile } = useImportDocument();

const fsEntryPath = computed(() =>
  PathUtils.join(directoryPath.value, name.value),
);

const onClickFSEntryContextAction = async ({
  key,
}: {
  key: FSEntryContextEvent;
}) => {
  switch (key) {
    case FSEntryContextEvent.remove: {
      await removeEntry(fsEntryPath.value);
      break;
    }
    case FSEntryContextEvent.rename: {
      showRenameDialog.value = true;
      break;
    }
    case FSEntryContextEvent.importJson: {
      await importJsonFile(directoryPath.value);
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

const onRenamedEntry = () => {
  showRenameDialog.value = false;
};

const tooltip = computed(() => `options ${name.value}`);
</script>

<template>
  <MDContextMenuButton
    :btns="contextBtns"
    :tooltip="tooltip"
    @click="onClickFSEntryContextAction"
  />

  <FSEntryRenameDialog
    v-if="showRenameDialog"
    v-model:show="showRenameDialog"
    :path="fsEntryPath"
    @cancel="showRenameDialog = false"
    @renamed="onRenamedEntry"
  />
</template>
