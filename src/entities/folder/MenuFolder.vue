<script setup lang="ts">
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import DocumentMenuItem from '../document/DocumentMenuItem.vue';
import type { DocumentId } from '@automerge/automerge-repo';

defineProps<{
  documentsMap: ReadonlyMap<DocumentId, CFRDocument>;
}>();

defineSlots<{
  contextMenu(props: { documentId: DocumentId; documentName: string }): unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, documentApi: CFRDocument];
}>();

const onClickDocumentItem = (
  documentId: DocumentId,
  documentApi: CFRDocument,
) => {
  emit('click', documentId, documentApi);
};
</script>

<template>
  <ul class="menu-list">
    <DocumentMenuItem
      v-for="[id, api] in documentsMap"
      :key="id"
      :cfrDocument="api"
      :document-id="id"
      @click="onClickDocumentItem"
    >
      <template #contextMenu="{ documentId, documentName }">
        <slot name="contextMenu" :document-id :document-name />
      </template>
    </DocumentMenuItem>
  </ul>
</template>
