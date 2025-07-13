<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { useDatabaseView } from '@shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref, toRefs, watchEffect } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId: DatabaseViewId;
}>();

const { docHandle, viewId } = toRefs(props);

const show = defineModel<boolean>('show', { required: true });

const view = useDatabaseView(docHandle, viewId);

const nameState = ref<string>();

watchEffect(() => {
  nameState.value = view.view?.name;
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
      await view.put({ name: nameState.value });
      emit('completed', nameState.value);
    } finally {
      loading.value -= 1;
    }
  }
};

const onCancel = () => {
  nameState.value = view.view?.name;
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
