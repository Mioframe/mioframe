<script setup lang="ts">
import { FSEntryManageMenuButton } from '@feature/entryManage';
import type { NonEmptyMenuButtonList } from '@feature/entryManage';

defineProps<{
  path: string;
  /** Pre-derived non-empty action list. Parent must not render this component when the list is empty. */
  actions: NonEmptyMenuButtonList;
}>();

const emit = defineEmits<{
  selectCreateDirectory: [];
  selectCreateDocument: [];
  selectRename: [];
  selectRemove: [];
  selectImportJson: [];
}>();

const onSelectCreateDirectory = () => {
  emit('selectCreateDirectory');
};

const onSelectCreateDocument = () => {
  emit('selectCreateDocument');
};

const onSelectRename = () => {
  emit('selectRename');
};

const onSelectRemove = () => {
  emit('selectRemove');
};

const onSelectImportJson = () => {
  emit('selectImportJson');
};
</script>

<template>
  <FSEntryManageMenuButton
    class="repository-explorer-entry-manage-button"
    :path="path"
    :actions="actions"
    @select-create-directory="onSelectCreateDirectory"
    @select-create-document="onSelectCreateDocument"
    @select-rename="onSelectRename"
    @select-remove="onSelectRemove"
    @select-import-json="onSelectImportJson"
  />
</template>
