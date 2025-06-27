<script setup lang="ts">
import { MDMainLayer } from '@shared/ui/Layers';
import DocumentViewWidget from '@widget/DocumentView/DocumentViewWidget.vue';
import { HomeWidget } from '@widget/HomeWidget';
import { RepoExplorerPane } from '@widget/RepoExplorer';
import { computed, ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { useDocumentFolder } from '@shared/lib/cfrDocument/useDocumentFolder';
import { useRepoExplorer } from '@widget/RepoExplorer/useRepoExplorer';

const { currentDirectory } = useRepoExplorer();

const openedDocument = ref<{
  documentId: AMDocumentId;
  directory: DirectoryFSEntry;
}>();

const openedDirectory = computed(() => openedDocument.value?.directory);

const documentFolder = useDocumentFolder(openedDirectory);

const openedDocumentId = computed(() => openedDocument.value?.documentId);

const openedDocumentName = computed(() =>
  openedDocumentId.value
    ? documentFolder.value?.documentMap.get(openedDocumentId.value)?.content
        ?.name
    : undefined,
);

const onClickDocument = (
  documentId: AMDocumentId,
  directory: DirectoryFSEntry,
) => {
  openedDocument.value = {
    documentId,
    directory,
  };
};

const onClickDocumentBack = () => {
  openedDocument.value = undefined;
};

const onOpenDirectory = () => {
  // TODO
};
</script>

<template>
  <MDMainLayer
    class="main-view"
    :show-second="!!openedDocument"
    :second-headline="openedDocumentName"
    @click-close-second="onClickDocumentBack"
  >
    <template #firstPane>
      <HomeWidget v-if="!currentDirectory" @open-directory="onOpenDirectory" />

      <RepoExplorerPane v-else @click-document="onClickDocument" />
    </template>

    <template v-if="openedDocument" #secondPane>
      <DocumentViewWidget
        :document-id="openedDocument.documentId"
        :directory="openedDocument.directory"
      />
    </template>
  </MDMainLayer>
</template>
