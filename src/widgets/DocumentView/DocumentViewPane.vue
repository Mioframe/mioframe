<script setup lang="ts">
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import DatabaseViewWidget from './Database/DatabaseViewWidget.vue';
import { MDPaneContainer } from '@shared/ui/Layers';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import { MDTopAppBar } from '@shared/ui/TopAppBar';
import { MDIconButton } from '@shared/ui/Button';
import { DocumentRenameDialog } from '@feature/documentRename';

const props = defineProps<{
  directory: DirectoryFSEntry;
  documentId: AMDocumentId;
}>();

const { directory, documentId } = toRefs(props);

const slots = defineSlots<{
  leadingNavigation: () => unknown;
}>();

const directoryRepo = useDirectoryRepo(directory);

const docHandle = computed(() =>
  documentId.value ? directoryRepo.value?.map.get(documentId.value) : undefined,
);

const cfrDocument = useCFRDocument(docHandle);

const content = computed(() => cfrDocument.content);

const documentType = computed(() => content.value?.type);

const documentName = computed(() => content.value?.name ?? 'unname');

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
      v-if="directory && docHandle && documentType === DATABASE_DOCUMENT_TYPE"
      :directory="directory"
      :doc-handle="docHandle"
    />

    <pre v-else>{{ content }}</pre>

    <DocumentRenameDialog
      v-if="docHandle"
      v-model:show="showRenameDocument"
      :doc-handle="docHandle"
      @renamed="showRenameDocument = false"
      @cancel="showRenameDocument = false"
    />
  </MDPaneContainer>
</template>
