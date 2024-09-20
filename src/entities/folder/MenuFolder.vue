<script setup lang="ts">
import type { DocumentApi } from '../../shared/lib/documentApi';
import DocumentMenuItem from '../document/DocumentMenuItem.vue';
import type { DocumentId } from '@automerge/automerge-repo';

defineProps<{
  documentsMap: ReadonlyMap<DocumentId, DocumentApi>;
}>();

defineSlots<{
  contextMenu(props: { documentId: DocumentId; documentName: string }): unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, documentApi: DocumentApi];
}>();

const onClickDocumentItem = (
  documentId: DocumentId,
  documentApi: DocumentApi,
) => {
  emit('click', documentId, documentApi);
};
</script>

<template>
  <ul class="menu-list">
    <DocumentMenuItem
      v-for="[id, api] in documentsMap"
      :key="id"
      :document-api="api"
      :document-id="id"
      @click="onClickDocumentItem"
    >
      <template #contextMenu="{ documentId, documentName }">
        <slot name="contextMenu" :document-id :document-name />
      </template>
    </DocumentMenuItem>
  </ul>
</template>
