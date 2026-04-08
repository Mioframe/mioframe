<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useRepository } from '@entity/repository';
import { useDocument } from '@entity/cfrDocument';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const { documentId, path } = toRefs(props);

const emit = defineEmits<{
  cancel: [];
  deleted: [];
}>();

const loading = ref(0);

const onApply = async () => {
  try {
    loading.value += 1;
    await deleteDocument(documentId.value);
    emit('deleted');
  } finally {
    loading.value -= 1;
  }
};

const onClickCancel = () => {
  emit('cancel');
};

const { deleteDocument } = useRepository(path);

const { state: documentDescription } = useDocument(path, documentId);

const documentName = computed(
  () => documentDescription.value?.name ?? 'unknown',
);

const headline = computed(() => `Remove "${documentName.value}"?`);

const supportingText = computed(
  () => `Are you sure you want to remove "${documentName.value}"?`,
);
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="supportingText"
    cancel-label="Cancel"
    apply-label="Remove"
    :loading="!!loading"
    has-cancel-action
    @apply="onApply"
    @cancel="onClickCancel"
  />
</template>
