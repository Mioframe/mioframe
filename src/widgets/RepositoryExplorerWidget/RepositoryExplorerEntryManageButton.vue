<script setup lang="ts">
import { useFSNodeStat } from '@entity/fsEntry';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { FSEntryManageMenuButton } from '@feature/entryManage';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { useImportDocumentAction } from '@feature/importDocument';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { computed, ref, toRefs } from 'vue';

const props = withDefaults(
  defineProps<{
    path: string;
    entryType: FSNodeType;
    showDocumentActions?: boolean | undefined;
  }>(),
  {
    showDocumentActions: false,
  },
);

const { path } = toRefs(props);
const { data: fsEntryStat } = useFSNodeStat(path);
const { importDocument } = useImportDocumentAction();
const { remove } = useRemoveFSEntry();

const showCreateDirectoryDialog = ref(false);
const showCreateDocumentDialog = ref(false);
const showRenameDialog = ref(false);

const canEditChildren = computed(() => fsEntryStat.value?.capabilities?.canEditChildren);
const canChangePath = computed(() => fsEntryStat.value?.capabilities?.canChangePath);
const canDelete = computed(() => fsEntryStat.value?.capabilities?.canDelete);

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
    :entry-type="entryType"
    :can-edit-children="canEditChildren"
    :can-change-path="canChangePath"
    :can-delete="canDelete"
    :show-document-actions="showDocumentActions"
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
