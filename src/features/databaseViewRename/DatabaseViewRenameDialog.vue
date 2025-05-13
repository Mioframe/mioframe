<script setup lang="ts">
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref, watchEffect } from 'vue';

const { name } = defineProps<{
  name: string;
  loading?: number | boolean | undefined;
}>();

const nameState = ref<string>();

watchEffect(() => {
  nameState.value = name;
});

const emit = defineEmits<{
  apply: [name: string];
  cancel: [];
}>();

const onApply = () => {
  if (nameState.value) {
    emit('apply', nameState.value);
  }
};

const onCancel = () => {
  nameState.value = name;
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Rename Data View"
    supporting-text="Give your data view a clear and meaningful name to improve organization and accessibility."
    apply-label="Rename"
    has-cancel-action
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="nameState" label-text="Name" />
  </MDDialog>
</template>
