<script setup lang="ts">
import { useCFRDocument } from './useCFRDocument';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { computed, toRef } from 'vue';
import { TreeItem } from '../../shared/ui/TreeMenu';
import type { DocumentId } from '@automerge/automerge-repo';

const props = defineProps<{
  cfrDocument: CFRDocument;
  documentId: DocumentId;
}>();

defineSlots<{
  contextMenu: (p: { documentId: DocumentId; documentName: string }) => unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, cfrDocument: CFRDocument];
}>();

const cfrDocumentRef = useCFRDocument(toRef(() => props.cfrDocument));

const documentName = computed(
  () => cfrDocumentRef.doc.value?.name ?? 'nameless',
);

const onClickItem = () => {
  emit('click', props.documentId, props.cfrDocument);
};
</script>

<template>
  <TreeItem
    :item="{
      label: documentName,
    }"
    :item-key="documentId"
    @click="onClickItem"
  >
    <template #contextMenu="{ key: contextKey }">
      <slot
        :document-id="contextKey"
        :document-name="documentName"
        name="contextMenu"
      />
    </template>
  </TreeItem>
</template>
