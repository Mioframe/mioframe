<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import type {
  AMDocHandle,
  AMDocumentId,
} from '@shared/lib/automerge/automergeTypes';

const { docHandle } = defineProps<{
  docHandle: AMDocHandle;
}>();

const docHandleRef = toRef(() => docHandle);

const emit = defineEmits<{
  cancel: [];
  apply: [documentId: AMDocumentId];
}>();

const loading = ref(0);

const onApply = () => {
  emit('apply', docHandle.documentId);
};

const onClickCancel = () => {
  emit('cancel');
};

const cfrDocument = useCFRDocument(docHandleRef);

const headline = computed(
  () => `Remove "${cfrDocument.content?.name ?? 'unknown'}"?`,
);

const supportingText = computed(
  () =>
    `Are you sure you want to remove "${cfrDocument.content?.name ?? 'unknown'}"?`,
);
</script>

<template>
  <MDDialog
    :headline
    :supporting-text
    cancel-label="Cancel"
    apply-label="Remove"
    :loading="!!loading"
    has-cancel-action
    @apply="onApply"
    @cancel="onClickCancel"
  />
</template>
