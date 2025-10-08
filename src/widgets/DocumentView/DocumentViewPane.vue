<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import DatabaseViewWidget from './Database/DatabaseViewWidget.vue';
import { MDPaneContainer } from '@shared/ui/Layers';
import type { EntryPath } from '@shared/lib/fileSystem';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDTopAppBar } from '@shared/ui/TopAppBar';
import { MDIconButton } from '@shared/ui/Button';
import { DocumentRenameDialog } from '@feature/documentRename';
import { useCFRDocumentClient } from '@entity/cfrDocument';
import { DomainError } from '@shared/lib/error';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
}>();

const { directoryPath, documentId } = toRefs(props);

const slots = defineSlots<{
  leadingNavigation: () => unknown;
}>();

const { getDocumentDescription } = useCFRDocumentClient();

const documentDescription = computed(
  ():
    | DomainError
    | {
        name: string;
        type: string;
        version?: number | undefined;
      }
    | undefined =>
    getDocumentDescription(directoryPath.value, documentId.value),
);

const documentType = computed(() => {
  if (documentDescription.value instanceof DomainError) {
    return undefined;
  }
  return documentDescription.value?.type;
});

const documentName = computed(
  () => documentDescription.value?.name ?? 'unname',
);

const showRenameDocument = ref(false);

const onClickRenameDocument = () => {
  showRenameDocument.value = true;
};
</script>

<template>
  <MDPaneContainer>
    <MDTopAppBar :headline="documentName">
      <template v-if="!!slots.leadingNavigation" #leadingNavigation>
        <slot name="leadingNavigation" />
      </template>

      <template #trailingInteractive>
        <MDIconButton
          tooltip="Rename document"
          md-symbol-name="edit"
          @click="onClickRenameDocument"
        />
      </template>
    </MDTopAppBar>

    <DatabaseViewWidget
      v-if="documentType === DATABASE_DOCUMENT_TYPE"
      :directory-path="directoryPath"
      :document-id="documentId"
    />

    <pre v-else>{{ documentDescription }}</pre>

    <DocumentRenameDialog
      v-model:show="showRenameDocument"
      :path="directoryPath"
      :document-id="documentId"
      @renamed="showRenameDocument = false"
      @cancel="showRenameDocument = false"
    />
  </MDPaneContainer>
</template>
