<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'es-toolkit';
import { computed, toRefs } from 'vue';
import { zodBooleanProperty } from './boolean';
import { useDatabaseProperty } from '@entity/databaseProperty';
import { zodCheck } from '@shared/lib/validateZodScheme';

const props = defineProps<{
  value: unknown;
  editable?: boolean;
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const emit = defineEmits<{ click: [] }>();

const { value, documentId, propertyId, path } = toRefs(props);

const { property } = useDatabaseProperty(path, documentId, propertyId);

const booleanProperty = computed(() => {
  if (zodCheck(zodBooleanProperty, property.value)) {
    return property.value;
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
