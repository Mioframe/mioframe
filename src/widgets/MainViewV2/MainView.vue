<script setup lang="ts">
import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createLogger } from '@shared/lib/logger';
import { MDMainLayer } from '@shared/ui/Layers';
import DocumentViewWidget from '@widget/DocumentView/DocumentViewWidget.vue';
import { HomeWidget } from '@widget/HomeWidget';
import { RepoExplorerWidget } from '@widget/RepoExplorer';
import { shallowRef } from 'vue';
import { useDirectoryRouter } from './useDirectoryExplorer';

const { debug } = createLogger('MainView');

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

const onOpenDirectory = (directory: DirectoryFSEntry) => {
  replace([directory]);
};

const { directoryStack, replace } = useDirectoryRouter();

const onUpdateDirectoryPath = (path: DirectoryFSEntry[]) => {
  replace(path);
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
      <HomeWidget
        v-if="!directoryStack.length"
        @open-directory="onOpenDirectory"
      />

      <RepoExplorerWidget
        v-else
        :directory-path="directoryStack"
        @update:directory-path="onUpdateDirectoryPath"
        @click-document="onClickDocument"
      />
    </template>

    <template v-if="openedDocument" #secondPane>
      <DocumentViewWidget :doc-handle="openedDocument" />
    </template>
  </MDMainLayer>
</template>
