<script setup lang="ts">
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import { MDTextField } from '@shared/ui/TextField';
import { ref, watchEffect } from 'vue';

const { name } = defineProps<{
  name?: string;
}>();

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = name;
});

const emit = defineEmits<{
  apply: [newName: string];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onApply = () => {
  if (stateName.value?.length) {
    emit('apply', stateName.value);
  }
};

const onCancel = () => {
  stateName.value = undefined;
  emit('cancel');
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Rename property"
    supporting-text="Enter a new property name"
    apply-label="Save"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template #icon>
      <MDSymbol name="edit" />
    </template>

    <MDTextField v-model:model-value="stateName" label-text="Property name" />
  </MDDialog>
</template>
