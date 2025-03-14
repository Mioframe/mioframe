<script setup lang="ts">
import type { ReactiveCFRDocument } from './createReactiveCFRDocument';
import { computed } from 'vue';
import type { DocumentId } from '@automerge/automerge-repo';
import { TreeIterableItem } from '@shared/ui/TreeMenu';

const props = defineProps<{
  reactiveCFRDocument: ReactiveCFRDocument;
  documentId: DocumentId;
}>();

defineSlots<{
  contextMenu: (p: { documentId: DocumentId; documentName: string }) => unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, reactiveCFRDocument: ReactiveCFRDocument];
}>();

const documentName = computed(
  () => props.reactiveCFRDocument.doc?.name ?? 'unknown',
);

const onClickItem = () => {
  emit('click', props.documentId, props.reactiveCFRDocument);
};
</script>

<template>
  <TreeIterableItem
    :item="props.reactiveCFRDocument"
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
  </TreeIterableItem>
</template>
