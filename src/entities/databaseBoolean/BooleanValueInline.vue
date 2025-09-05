<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import {
  useDatabaseProperty,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'es-toolkit';
import { computed, toRefs } from 'vue';
import { zodBooleanProperty } from './boolean';

const props = defineProps<{
  value: unknown;
  editable?: boolean;
  docHandle: AMDocHandle;
  propertyId: DatabasePropertyId;
}>();

const { value, docHandle, propertyId } = toRefs(props);

const emit = defineEmits<{ click: [] }>();

const { property } = useDatabaseProperty(
  docHandle,
  propertyId,
  zodBooleanProperty,
);

const name = computed(() => property.value?.name);

const indeterminate = computed(() => property.value?.indeterminate);

const convertedValue = computed(() =>
  isBoolean(value.value) ? value.value : property.value?.default,
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
