<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useFSEntryManageActions } from '@feature/entryManage';
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
  selectCreateDirectory: [entryPath: string];
  selectCreateDocument: [entryPath: string];
  selectRename: [entryPath: string];
  selectRemove: [entryPath: string];
  selectImportJson: [entryPath: string];
  selectExportZip: [entryPath: string];
  selectImportZip: [entryPath: string];
}>();

const isDirectoryEntry = computed(() => props.entryType === FSNodeType.Directory);

const { hasActions, nonEmptyActionButtons } = useFSEntryManageActions({
  entryType: toRef(props, 'entryType'),
  canEditChildren: toRef(props, 'canEditChildren'),
  canChangePath: toRef(props, 'canChangePath'),
  canDelete: toRef(props, 'canDelete'),
  showCreateDocumentAction: isDirectoryEntry,
  showImportActions: isDirectoryEntry,
});

const entryPath = computed(() => PathUtils.join(props.directoryPath, props.name));

const onSelectCreateDirectory = () => {
  emit('selectCreateDirectory', entryPath.value);
};
const onSelectCreateDocument = () => {
  emit('selectCreateDocument', entryPath.value);
};
const onSelectRename = () => {
  emit('selectRename', entryPath.value);
};
const onSelectRemove = () => {
  emit('selectRemove', entryPath.value);
};
const onSelectImportJson = () => {
  emit('selectImportJson', entryPath.value);
};
const onSelectExportZip = () => {
  emit('selectExportZip', entryPath.value);
};
const onSelectImportZip = () => {
  emit('selectImportZip', entryPath.value);
};

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
    </template>
  </FSEntryMDListItem>
</template>
