<script setup lang="ts">
import { useDirectory } from '@entity/directory/useDirectory';
import { useFSNodeStat } from '@entity/fsEntry';
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
  remove,
  rename,
  importJson,
}

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
  renameButton,
  removeButton,
  importJsonButton,
]);

const fileActionButtons = defineMenuButtonList([renameButton, removeButton]);

const parentPath = computed(() => PathUtils.dirname(path.value));

const fsEntryName = computed(() => PathUtils.basename(path.value));

const { data: parentData } = useDirectory(parentPath);

const fileType = computed(
  () => parentData.value?.find(([name]) => name === fsEntryName.value)?.[1].type,
);

const actionButtons = computed(() => {
  const buttonList =
    fileType.value === FSNodeType.Directory ? directoryActionButtons : fileActionButtons;

  return buttonList.filter(({ key }) => {
    switch (key) {
      case FSEntryContextEvent.remove:
        return fsEntryStat.value?.capabilities?.canDelete;
      case FSEntryContextEvent.rename:
        return fsEntryStat.value?.capabilities?.canChangePath;
      case FSEntryContextEvent.importJson:
        return fsEntryStat.value?.capabilities?.canEditChildren;
      default:
        return true;
    }
  });
});

const { remove: removeEntry } = useRemoveFSEntry();

const showRenameDialog = shallowRef(false);

const { importJsonFile } = useImportDocument();

const onClickMenuAction = async ({ key }: { key: FSEntryContextEvent }) => {
  switch (key) {
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

const menuTooltip = computed(() => `options ${fsEntryName.value}`);
</script>

<template>
  <MDContextMenuButton
    :btns="actionButtons"
    :tooltip="menuTooltip"
    @click="onClickMenuAction"
  />

  <FSEntryRenameDialog
    v-if="showRenameDialog"
    :path="path"
    @cancel="showRenameDialog = false"
    @renamed="onRenamedEntry"
  />
</template>
