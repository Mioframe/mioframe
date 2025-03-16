<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const docHandleRef = toRef(() => docHandle);

const emit = defineEmits<{
  cancel: [];
  apply: [documentId: DocumentId];
}>();

const loading = ref(0);

const onApply = () => {
  // loading.value += 1;
  // docHandle.delete(); // FIXME: удаление документа не удаляет файлы? документ не удаляется
  // loading.value -= 1;
  emit('apply', docHandle.documentId);
};

const onClickCancel = () => {
  emit('cancel');
};

const { name } = useCFRDocument(docHandleRef);

const headline = computed(() => `Remove "${name.value}"?`);

const supportingText = computed(
  () => `Are you sure you want to remove "${name.value}"?`,
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
