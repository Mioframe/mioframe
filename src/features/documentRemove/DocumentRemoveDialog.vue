<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import type {
  DocHandle,
  DocumentId,
} from '@shared/lib/cfrDocument/automergeTypes';

const { docHandle } = defineProps<{
  docHandle: DocHandle;
}>();

const docHandleRef = toRef(() => docHandle);

const emit = defineEmits<{
  cancel: [];
  apply: [documentId: DocumentId];
}>();

const loading = ref(0);

const onApply = () => {
  emit('apply', docHandle.documentId);
};

const onClickCancel = () => {
  emit('cancel');
};

const { name } = useCFRDocument(docHandleRef);

const headline = computed(() => `Remove "${name.value ?? 'unknown'}"?`);

const supportingText = computed(
  () => `Are you sure you want to remove "${name.value ?? 'unknown'}"?`,
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
