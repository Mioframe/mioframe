<script setup lang="ts">
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { computed } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import DatabaseViewWidget from './Database/DatabaseViewWidget.vue';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';

/**
 * Виджет просмотра документа
 */

const { directory, documentId } = defineProps<{
  directory: DirectoryFSEntry;
  documentId: AMDocumentId;
}>();

const directoryRef = computed(() => directory);

const repo = useDirectoryRepo(directoryRef);

const docHandle = computed(() => repo.value?.map.get(documentId));

const cfrDocument = useCFRDocument(docHandle);

const content = computed(() => cfrDocument.content);

const documentType = computed(() => content.value?.type);
</script>

<template>
  <div class="document-view-widget">
    <DatabaseViewWidget
      v-if="docHandle && documentType === DATABASE_DOCUMENT_TYPE"
      :directory="directory"
      :doc-handle="docHandle"
    />

    <pre v-else>{{ content }}</pre>
  </div>
</template>

<style lang="css" scoped>
.document-view-widget {
  position: relative;
  flex: 1 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>
