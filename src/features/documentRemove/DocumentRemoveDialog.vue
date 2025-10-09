<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useDocumentRepoClient } from '@entity/documentRepo';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { useCFRDocumentClient } from '@entity/cfrDocument';

const props = defineProps<{
  path: EntryPath | EntryPathString;
  documentId: AMDocumentId;
}>();

const { documentId, path } = toRefs(props);

const show = defineModel<boolean>('show', { required: true });

const emit = defineEmits<{
  cancel: [];
  deleted: [];
}>();

const loading = ref(0);

const onApply = async () => {
  try {
    loading.value += 1;
    await removeDocument(path.value, documentId.value);
    emit('deleted');
  } finally {
    loading.value -= 1;
  }
};

const onClickCancel = () => {
  emit('cancel');
};

const { removeDocument } = useDocumentRepoClient();

const {
  getDocumentDescription: { get: getDocumentDescription },
} = useCFRDocumentClient();

const documentDescription = computed(() =>
  getDocumentDescription(path.value, documentId.value),
);

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
    v-model:show="show"
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
