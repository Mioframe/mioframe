<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'es-toolkit';
import { computed, toRefs } from 'vue';
import { zodBooleanProperty } from './boolean';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import type { EntryPath } from '@shared/lib/fileSystem';
import { zodCheck } from '@shared/lib/validateZodScheme';

const props = defineProps<{
  value: unknown;
  editable?: boolean;
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { value, documentId, propertyId, directoryPath } = toRefs(props);

const emit = defineEmits<{ click: [] }>();

const {
  getProperty,
} = useDatabasePropertiesClient();

const booleanProperty = computed(() => {
  const property = getProperty(
    directoryPath.value,
    documentId.value,
    propertyId.value,
  );

  if (zodCheck(zodBooleanProperty, property)) {
    return property;
  }

  return undefined;
});

const name = computed(() => booleanProperty.value?.name);

const indeterminate = computed(() => booleanProperty.value?.indeterminate);

const convertedValue = computed(() =>
  isBoolean(value.value) ? value.value : booleanProperty.value?.default,
);
</script>

<template>
  <MDCheckbox
    :model-value="convertedValue"
    :indeterminate="indeterminate"
    :readonly="!editable"
    :tooltip="name"
    @click="emit('click')"
  />
</template>
