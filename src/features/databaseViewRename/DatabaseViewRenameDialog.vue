<script setup lang="ts">
import { useDatabaseView } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref, toRefs, watchEffect } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath: path, documentId, viewId } = toRefs(props);

const show = defineModel<boolean>('show', { required: true });

const { view: stateView, patch } = useDatabaseView(path, documentId, viewId);

const nameState = ref<string>();

const resetNameState = () => {
  if (!(stateView.value instanceof DomainError)) {
    nameState.value = stateView.value?.name;
  }
};

watchEffect(() => {
  resetNameState();
});

const emit = defineEmits<{
  completed: [name: string];
  cancel: [];
}>();

const loading = ref(0);

const onApply = async () => {
  if (nameState.value) {
    try {
      loading.value += 1;
      await patch({
        name: nameState.value,
      });
      emit('completed', nameState.value);
    } finally {
      loading.value -= 1;
    }
  }
};

const onCancel = () => {
  resetNameState();
  emit('cancel');
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Rename Data View"
    supporting-text="Give your data view a clear and meaningful name to improve organization and accessibility."
    apply-label="Rename"
    has-cancel-action
    :loading="!!loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="nameState" label-text="Name" />
  </MDDialog>
</template>
