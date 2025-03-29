<script setup lang="ts">
import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDMainLayer } from '@shared/ui/Layers';
import DocumentViewWidget from '@widget/DocumentView/DocumentViewWidget.vue';
import { HomeWidget } from '@widget/HomeWidget';
import { RepoExplorerWidget } from '@widget/RepoExplorer';
import { shallowRef } from 'vue';

const openedDocument = shallowRef<DocHandle<unknown>>();

const { name: openedDocumentName } = useCFRDocument(openedDocument);

const onClickDocument = (
  _documentId: DocumentId,
  docHandle: DocHandle<unknown>,
) => {
  openedDocument.value = docHandle;
};

const onClickDocumentBack = () => {
  openedDocument.value = undefined;
};

const directoryPath = shallowRef<DirectoryFSEntry[]>([]);
</script>

<template>
  <MDMainLayer
    class="main-view"
    :show-second="!!openedDocument"
    :second-headline="openedDocumentName"
    @click-close-second="onClickDocumentBack"
  >
    <template #firstPane>
      <HomeWidget
        v-if="!directoryPath.length"
        v-model:directory-path="directoryPath"
      />

      <RepoExplorerWidget
        v-else
        v-model:directory-path="directoryPath"
        @click-document="onClickDocument"
      />
    </template>

    <template v-if="openedDocument" #secondPane>
      <DocumentViewWidget :doc-handle="openedDocument" />
    </template>
  </MDMainLayer>
</template>
