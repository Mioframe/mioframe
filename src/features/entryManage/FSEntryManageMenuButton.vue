<script setup lang="ts">
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { MDContextMenuButton } from '@shared/ui/Menu';
import { computed, toRefs } from 'vue';
import { useFSEntryManageActions } from './useFSEntryManageActions';

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
const { path, entryType, canEditChildren, canChangePath, canDelete, showDocumentActions } =
  toRefs(props);

const fsEntryName = computed(() => PathUtils.basename(path.value));

const { actionButtons } = useFSEntryManageActions({
  entryType,
  canEditChildren,
  canChangePath,
  canDelete,
  showDocumentActions,
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
