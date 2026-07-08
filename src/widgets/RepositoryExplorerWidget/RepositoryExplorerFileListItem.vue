<script lang="ts">
// inheritAttrs is declared in a plain <script> block instead of defineOptions() in <script
// setup> because defineOptions() options must stay statically hoistable; a plain module-scope
// export does not have that restriction. Attrs (e.g. the list-item class) forward explicitly
// onto the primary interactive element instead of Vue's default single-root behavior, since
// this component's root is a fragment (list item plus its sibling entry-manage dialogs).
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useFSEntryManageActions, useEntryManageDialogState } from '@feature/entryManage';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { useImportDocumentAction } from '@feature/importDocument';
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
  selectExportZip: [entryPath: string];
  selectImportZip: [entryPath: string];
}>();

const showDocumentActions = computed(() => props.entryType === FSNodeType.Directory);

const { hasActions, nonEmptyActionButtons } = useFSEntryManageActions({
  entryType: toRef(props, 'entryType'),
  canEditChildren: toRef(props, 'canEditChildren'),
  canChangePath: toRef(props, 'canChangePath'),
  canDelete: toRef(props, 'canDelete'),
  showDocumentActions,
});

const entryPath = computed(() => PathUtils.join(props.directoryPath, props.name));

const {
  showCreateDirectoryDialog,
  showCreateDocumentDialog,
  showRenameDialog,
  onSelectCreateDirectory,
  onSelectCreateDocument,
  onSelectRename,
  onCloseCreateDirectoryDialog,
  onCloseCreateDocumentDialog,
  onCloseRenameDialog,
} = useEntryManageDialogState(entryPath);

const { remove } = useRemoveFSEntry();
const { importDocument } = useImportDocumentAction();

const onSelectRemove = async () => {
  await remove(entryPath.value);
};
const onSelectImportJson = async () => {
  await importDocument(entryPath.value);
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
  <!-- eslint-disable vue/no-restricted-v-bind -- transparent $attrs forwarding onto the primary root element, required because this component's root is a fragment (list item plus sibling entry-manage dialogs) -->
  <FSEntryMDListItem
    v-bind="$attrs"
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
  <!-- eslint-enable vue/no-restricted-v-bind -->

  <DirectoryCreateDialog
    v-if="showCreateDirectoryDialog"
    :path="entryPath"
    @cancel="onCloseCreateDirectoryDialog"
    @created="onCloseCreateDirectoryDialog"
  />

  <DocumentCreationDialog
    v-if="showCreateDocumentDialog"
    :path="entryPath"
    @cancel="onCloseCreateDocumentDialog"
    @created="onCloseCreateDocumentDialog"
  />

  <FSEntryRenameDialog
    v-if="showRenameDialog"
    :path="entryPath"
    @cancel="onCloseRenameDialog"
    @renamed="onCloseRenameDialog"
  />
</template>
