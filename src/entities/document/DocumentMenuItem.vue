<script setup lang="ts">
import { useDocument } from './useDocument';
import type { DocumentApi } from '../../shared/lib/documentApi';
import { computed, toRef } from 'vue';
import { TreeItem } from '../../shared/ui/TreeMenu';
import type { DocumentId } from '@automerge/automerge-repo';

const props = defineProps<{
  documentApi: DocumentApi;
  documentId: DocumentId;
}>();

defineSlots<{
  contextMenu: (p: { documentId: DocumentId; documentName: string }) => unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, documentApi: DocumentApi];
}>();

const documentApi = toRef(() => props.documentApi);

const document = useDocument(documentApi);

const documentName = computed(() => document.doc.value?.name ?? 'nameless');

const onClickItem = () => {
  emit('click', props.documentId, props.documentApi);
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
