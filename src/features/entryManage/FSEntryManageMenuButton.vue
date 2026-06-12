<script setup lang="ts">
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { MDContextMenuButton, type MenuButtonList } from '@shared/ui/Menu';
import { computed } from 'vue';

type FSEntryManageMenuButtonProps = {
  path: string;
  /** Pre-derived non-empty action list. Parent must not render this button when the list is empty. */
  actions: MenuButtonList;
};

const props = defineProps<FSEntryManageMenuButtonProps>();

const emit = defineEmits<{
  selectCreateDirectory: [];
  selectCreateDocument: [];
  selectRename: [];
  selectRemove: [];
  selectImportJson: [];
}>();

const fsEntryName = computed(() => PathUtils.basename(props.path));
const menuTooltip = computed(() => `options ${fsEntryName.value}`);

const onClickMenuAction = ({ key }: { key: string | number }) => {
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
  <MDContextMenuButton :btns="actions" :tooltip="menuTooltip" @click="onClickMenuAction" />
</template>
