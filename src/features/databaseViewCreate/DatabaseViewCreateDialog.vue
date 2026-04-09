<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { DB_VIEW_LAYOUT } from '@shared/lib/databaseDocument';
import { objectEntries } from '@shared/lib/objectEntries';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSelect } from '@shared/ui/Select';
import { defineSelectOption, defineSelectOptions } from '@shared/ui/Select/defineSelectOptions';
import { MDTextField } from '@shared/ui/TextField';
import { pascalCase } from 'es-toolkit';
import { computed, reactive, ref, toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const { documentId, directoryPath: path } = toRefs(props);

const emit = defineEmits<{
  created: [id: DatabaseViewId];
  cancel: [];
}>();

const initialState = (): {
  layout: DB_VIEW_LAYOUT;
  name: string | undefined;
} => ({
  layout: DB_VIEW_LAYOUT.TABLE,
  name: undefined,
});

const formState = reactive(initialState());

const loading = ref(0);

const { create } = useDatabaseViews(path, documentId);

const onApply = async () => {
  if (formState.name) {
    try {
      loading.value += 1;

      const id = await create({
        name: formState.name,
        layout: formState.layout,
      });
      emit('created', id);
    } finally {
      loading.value -= 1;
    }
  }
};

const onCancel = () => {
  deepPutJsonObject(formState, initialState());
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
    :loading="!!loading"
    headline="Add view"
    supporting-text="Enter the name of the new data view."
    apply-label="Create"
    has-cancel-action
    @cancel="onCancel"
    @apply="onApply"
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
