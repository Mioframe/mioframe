<script setup lang="ts">
import type { DatabaseView } from '@shared/lib/databaseDocument';
import { DB_VIEW_LAYOUT } from '@shared/lib/databaseDocument';
import { objectEntries } from '@shared/lib/objectEntries';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSelect } from '@shared/ui/Select';
import {
  defineSelectOption,
  defineSelectOptions,
} from '@shared/ui/Select/defineSelectOptions';
import { MDTextField } from '@shared/ui/TextField';
import { pascalCase } from 'es-toolkit';
import { computed, reactive } from 'vue';

const {} = defineProps<{
  loading?: boolean | number;
}>();

const emit = defineEmits<{
  submit: [DatabaseView];
  cancel: [];
}>();

const formState = reactive<{
  layout: DB_VIEW_LAYOUT;
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

const layoutOptions = defineSelectOptions(
  objectEntries(DB_VIEW_LAYOUT).map(([key, value]) =>
    defineSelectOption({ label: pascalCase(key), key: value }),
  ),
);

type LayoutOption = (typeof layoutOptions)[number];

const selectedLayoutOption = computed((): LayoutOption[] =>
  layoutOptions.filter((option) => formState.layout === option.key),
);

const onChangeLayout = (selectedOptions: LayoutOption[]) => {
  const firstOption = selectedOptions.at(0);
  if (firstOption) {
    formState.layout = firstOption.key;
  }
};
</script>

<template>
  <MDDialog
    :loading="loading"
    headline="Add view"
    supporting-text="Enter the name of the new data view."
    apply-label="Create"
    has-cancel-action
    @cancel="onCancel"
    @apply="onSubmit"
  >
    <MDTextField v-model:model-value="formState.name" label-text="Name" />

    <MDSelect
      :model-value="selectedLayoutOption"
      :options="layoutOptions"
      label-text="layout"
      @update:model-value="onChangeLayout"
    />
  </MDDialog>
</template>
