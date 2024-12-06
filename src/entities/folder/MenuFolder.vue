<script setup lang="ts">
import { TreeIterable } from '@shared/ui/TreeMenu';
import type { DocumentId } from '@automerge/automerge-repo';
import type { IterableCollection } from '@shared/ui/TreeMenu/useIterable';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';

defineProps<{
  folderContents: IterableCollection<DocumentId, ReactiveCFRDocument>;
}>();

defineSlots<{
  contextMenu(props: { documentId: DocumentId; documentName: string }): unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, reactiveCFRDocument: ReactiveCFRDocument];
}>();

const onClickDocumentItem = (
  documentId: DocumentId,
  reactiveCFRDocument: ReactiveCFRDocument,
) => {
  emit('click', documentId, reactiveCFRDocument);
};

// todo: нужно сделать папки документов с children
</script>

<template>
  <ul class="menu-list">
    <!--
      <DocumentMenuItem
      v-for="[id, cfrDocument] in folderContents"
      :key="id"
      :cfr-document="cfrDocument"
      :document-id="id"
      @click="onClickDocumentItem"
      >
      <template #contextMenu="{ documentId, documentName }">
      <slot name="contextMenu" :document-id :document-name />
      </template>
      </DocumentMenuItem> 
    -->

    <TreeIterable :collection="folderContents" @click="onClickDocumentItem">
      <template #label="{ item: { doc } }">{{ doc?.name }}</template>
    </TreeIterable>
  </ul>
</template>
