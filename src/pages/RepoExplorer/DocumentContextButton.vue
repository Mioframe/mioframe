<script setup lang="ts">
import { useDocument } from '@entity/cfrDocument';
import { DocumentRemoveDialog } from '@feature/documentRemove';
import { DocumentRenameDialog } from '@feature/documentRename';
import { useExportDocument } from '@feature/exportDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { computed, shallowRef, toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const { documentId, directoryPath } = toRefs(props);

enum DocumentContextEvent {
  remove,
  rename,
  exportJson,
}

const documentContextBtns = defineMenuButtonList([
  { label: 'Rename', symbolName: 'edit', key: DocumentContextEvent.rename },

  {
    label: 'Export JSON',
    symbolName: 'file_json',
    key: DocumentContextEvent.exportJson,
  },

  {
    label: 'Remove',
    symbolName: 'delete_forever',
    key: DocumentContextEvent.remove,
  },
]);

const { saveJsonFile } = useExportDocument();

const showRenameDialog = shallowRef(false);
const showRemoveDialog = shallowRef(false);

const onClickContextAction = async ({ key }: { key: DocumentContextEvent }) => {
  switch (key) {
    case DocumentContextEvent.remove: {
      showRemoveDialog.value = true;
      break;
    }
    case DocumentContextEvent.rename: {
      showRenameDialog.value = true;
      break;
    }
    case DocumentContextEvent.exportJson: {
      await saveJsonFile(directoryPath.value, documentId.value);
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

const { state } = useDocument(directoryPath, documentId);

const documentName = computed(() => state.value?.name ?? 'unknown document');

const tooltip = computed(() => `options ${documentName.value}`);
</script>

<template>
  <MDContextMenuButton
    :btns="documentContextBtns"
    :tooltip="tooltip"
    @click="onClickContextAction"
  />

  <DocumentRemoveDialog
    v-if="showRemoveDialog"
    :path="directoryPath"
    :document-id="documentId"
    @cancel="showRemoveDialog = false"
    @deleted="showRemoveDialog = false"
  />

  <DocumentRenameDialog
    v-if="showRenameDialog"
    :path="directoryPath"
    :document-id="documentId"
    @renamed="showRenameDialog = false"
    @cancel="showRenameDialog = false"
  />
</template>
