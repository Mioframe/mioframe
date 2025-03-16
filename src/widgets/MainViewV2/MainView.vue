<script setup lang="ts">
import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { MDMainLayer } from '@shared/ui/Layers';
import DocumentViewWidget from '@widget/DocumentView/DocumentViewWidget.vue';
import { ExplorerWidget } from '@widget/Explorer';
import { shallowRef } from 'vue';

const openedDocument = shallowRef<DocHandle<unknown>>();

const onClickDocument = (
  documentId: DocumentId,
  docHandle: DocHandle<unknown>,
) => {
  openedDocument.value = docHandle;
};

const onClickDocumentBack = () => {
  openedDocument.value = undefined;
};
</script>

<template>
  <MDMainLayer class="main-view" :show-second="!!openedDocument">
    <template #firstPane>
      <ExplorerWidget @click-document="onClickDocument" />
    </template>

    <template v-if="openedDocument" #secondPane>
      <DocumentViewWidget
        :doc-handle="openedDocument"
        @click-back="onClickDocumentBack"
      />
    </template>
  </MDMainLayer>
</template>
