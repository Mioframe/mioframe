<script setup lang="ts">
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { MDMainLayer } from '@shared/ui/Layers';
import DocumentViewWidget from '@widget/DocumentView/DocumentViewWidget.vue';
import { HomeWidget } from '@widget/HomeWidget';
import { RepoExplorerPane } from '@widget/RepoExplorer';
import { shallowRef } from 'vue';
import { useRepoExplorer } from '../RepoExplorer/useRepoExplorer';
import type {
  AMDocHandle,
  AMDocumentId,
} from '@shared/lib/automerge/automergeTypes';

const { currentDirectory } = useRepoExplorer();

const openedDocument = shallowRef<AMDocHandle>();

const { name: openedDocumentName } = useCFRDocument(openedDocument);

const onClickDocument = (_documentId: AMDocumentId, docHandle: AMDocHandle) => {
  openedDocument.value = docHandle;
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
      <DocumentViewWidget :doc-handle="openedDocument" />
    </template>
  </MDMainLayer>
</template>
