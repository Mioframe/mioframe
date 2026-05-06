<script setup lang="ts">
import { useDocument } from '@entity/cfrDocument';
import { DocumentRemoveDialog } from '@feature/documentRemove';
import { DocumentRenameDialog } from '@feature/documentRename';
import { useExportDocument } from '@feature/exportDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { useSnackbar } from '@shared/ui/Snackbar';
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

const documentActionButtons = defineMenuButtonList([
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
const { addSnackbar } = useSnackbar();

const shouldSkipExportErrorReport = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const showRenameDialog = shallowRef(false);
const showRemoveDialog = shallowRef(false);

const onClickMenuAction = async ({ key }: { key: DocumentContextEvent }) => {
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
      try {
        const exported = await saveJsonFile(directoryPath.value, documentId.value);

        if (exported) {
          addSnackbar({ text: 'Document exported' });
        }
      } catch (error) {
        addSnackbar({
          text: error instanceof DomainError ? error.message : 'Could not export the document',
        });
        if (!shouldSkipExportErrorReport(error)) {
          reportHandledError(error, {
            feature: 'documentExport',
            action: 'exportDocumentJson',
            path: directoryPath.value,
          });
        }
      }
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

const { state } = useDocument(directoryPath, documentId);

const documentName = computed(() => state.value?.name ?? 'unknown document');

const menuTooltip = computed(() => `options ${documentName.value}`);

const onCancelRemoveDialog = () => {
  showRemoveDialog.value = false;
};

const onDeletedDocument = () => {
  showRemoveDialog.value = false;
};

const onRenamedDocument = () => {
  showRenameDialog.value = false;
};

const onCancelRenameDialog = () => {
  showRenameDialog.value = false;
};
</script>

<template>
  <MDContextMenuButton
    :btns="documentActionButtons"
    :tooltip="menuTooltip"
    @click="onClickMenuAction"
  />

  <DocumentRemoveDialog
    v-if="showRemoveDialog"
    :path="directoryPath"
    :document-id="documentId"
    @cancel="onCancelRemoveDialog"
    @deleted="onDeletedDocument"
  />

  <DocumentRenameDialog
    v-if="showRenameDialog"
    :path="directoryPath"
    :document-id="documentId"
    @renamed="onRenamedDocument"
    @cancel="onCancelRenameDialog"
  />
</template>
