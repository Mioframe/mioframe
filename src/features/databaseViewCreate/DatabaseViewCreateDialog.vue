<script setup lang="ts">
import type { DatabaseView } from '@shared/lib/databaseDocument/migrations/versions';
import { DB_VIEW_LAYOUT } from '@shared/lib/databaseDocument/migrations/versions';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import type { ValueOf } from 'type-fest';
import { reactive } from 'vue';

const {} = defineProps<{
  loading?: boolean | number;
}>();

const emit = defineEmits<{
  submit: [DatabaseView];
  cancel: [];
}>();

const formState = reactive<{
  layout: ValueOf<typeof DB_VIEW_LAYOUT>;
  name: string | undefined;
}>({
  layout: DB_VIEW_LAYOUT.TABLE,
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
    :loading
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
