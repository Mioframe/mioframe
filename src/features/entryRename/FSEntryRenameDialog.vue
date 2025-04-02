<script setup lang="ts">
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref, watchEffect } from 'vue';

const { name: originalName } = defineProps<{
  name: string;
  loading?: boolean | undefined;
}>();

const emit = defineEmits<{
  rename: [name: string];
  cancel: [];
}>();

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = originalName;
});

const onApply = () => {
  if (stateName.value) {
    emit('rename', stateName.value);
  }
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Rename"
    supporting-text="Enter a new name"
    apply-label="Rename"
    has-cancel-action
    :loading
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model="stateName" label-text="Name" />
  </MDDialog>
</template>
