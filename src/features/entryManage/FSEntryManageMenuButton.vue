<script setup lang="ts">
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { computed, toRefs } from 'vue';

type FSEntryManageMenuButtonProps = {
  path: string;
  entryType: FSNodeType;
  canEditChildren?: boolean | undefined;
  canChangePath?: boolean | undefined;
  canDelete?: boolean | undefined;
  showDocumentActions?: boolean | undefined;
};

const props = defineProps<FSEntryManageMenuButtonProps>();

const emit = defineEmits<{
  selectCreateDirectory: [];
  selectCreateDocument: [];
  selectRename: [];
  selectRemove: [];
  selectImportJson: [];
}>();
const { path } = toRefs(props);

const fsEntryName = computed(() => PathUtils.basename(path.value));
const isDirectory = computed(() => props.entryType === FSNodeType.Directory);

const actionButtons = computed(() => {
  const buttons: Array<{ key: string; label: string; symbolName: string }> = [];

  if (isDirectory.value && props.canEditChildren !== false && props.showDocumentActions === true) {
    buttons.push({
      key: 'createDirectory',
      label: 'Create directory',
      symbolName: 'create_new_folder',
    });
    buttons.push({
      key: 'createDocument',
      label: 'Create document',
      symbolName: 'edit_document',
    });
  } else if (isDirectory.value && props.canEditChildren !== false) {
    buttons.push({
      key: 'createDirectory',
      label: 'Create directory',
      symbolName: 'create_new_folder',
    });
  }

  if (props.canChangePath === true) {
    buttons.push({
      key: 'rename',
      label: 'Rename',
      symbolName: 'edit',
    });
  }

  if (isDirectory.value && props.canEditChildren !== false && props.showDocumentActions === true) {
    buttons.push({
      key: 'importJson',
      label: 'Import JSON',
      symbolName: 'file_copy',
    });
  }

  if (props.canDelete === true) {
    buttons.push({
      key: 'remove',
      label: 'Remove',
      symbolName: 'delete',
    });
  }

  return defineMenuButtonList(buttons);
});

const menuTooltip = computed(() => `options ${fsEntryName.value}`);

const onClickMenuAction = ({ key }: { key: string }) => {
  switch (key) {
    case 'createDirectory':
      emit('selectCreateDirectory');
      break;
    case 'createDocument':
      emit('selectCreateDocument');
      break;
    case 'remove':
      emit('selectRemove');
      break;
    case 'rename':
      emit('selectRename');
      break;
    case 'importJson':
      emit('selectImportJson');
      break;
  }
};
</script>

<template>
  <MDContextMenuButton :btns="actionButtons" :tooltip="menuTooltip" @click="onClickMenuAction" />
</template>
