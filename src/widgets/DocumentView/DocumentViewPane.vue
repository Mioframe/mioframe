<script setup lang="ts">
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { computed, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import DatabaseViewWidget from './Database/DatabaseViewWidget.vue';
import { MDPaneContainer } from '@shared/ui/Layers';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';

const props = defineProps<{
  directory: DirectoryFSEntry;
  documentId: AMDocumentId;
}>();

const { directory, documentId } = toRefs(props);

const directoryRepo = useDirectoryRepo(directory);

const docHandle = computed(() =>
  documentId.value ? directoryRepo.value?.map.get(documentId.value) : undefined,
);

const cfrDocument = useCFRDocument(docHandle);

const content = computed(() => cfrDocument.content);

const documentType = computed(() => content.value?.type);
</script>

<template>
  <MDPaneContainer>
    <!-- TODO: добавить шапку с названием документа и кнопкой закрытия документа -->
    <DatabaseViewWidget
      v-if="directory && docHandle && documentType === DATABASE_DOCUMENT_TYPE"
      :directory="directory"
      :doc-handle="docHandle"
    />

    <pre v-else>{{ content }}</pre>
  </MDPaneContainer>
</template>
