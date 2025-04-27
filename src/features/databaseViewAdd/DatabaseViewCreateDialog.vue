<script setup lang="ts">
import { VIEW_LAYOUT } from '@shared/lib/databaseDocument/view/general';
import { MDDialog } from '@shared/ui/Dialog';
import MDTextField from '@shared/ui/TextField/MDTextField.vue';
import type { ValueOf } from 'type-fest';
import { reactive } from 'vue';

const emit = defineEmits<{
  submit: [
    {
      name: string;
      layout: string;
    },
  ];
  cancel: [];
}>();

const formState = reactive<{
  layout: ValueOf<typeof VIEW_LAYOUT>;
  name: string | undefined;
}>({
  layout: VIEW_LAYOUT.TABLE,
  name: undefined,
});

const onSubmit = () => {
  if (formState.name) {
    emit('submit', {
      name: formState.name,
      layout: formState.layout,
    });
  }
};
const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Add view"
    supporting-text="Enter the name of the new data view."
    apply-label="Create"
    has-cancel-action
    @cancel="onCancel"
    @apply="onSubmit"
  >
    <MDTextField v-model:model-value="formState.name" label-text="Name" />
  </MDDialog>
</template>
