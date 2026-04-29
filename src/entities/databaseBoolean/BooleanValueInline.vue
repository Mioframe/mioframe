<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'es-toolkit';
import { computed, toRefs } from 'vue';
import type { BooleanProperty } from './boolean';

const props = withDefaults(
  defineProps<{
    value: unknown;
    property: BooleanProperty;
  }>(),
  {},
);

const { value, property } = toRefs(props);

const name = computed(() => property.value.name);

const indeterminate = computed(() => property.value.indeterminate);

const convertedValue = computed(() =>
  isBoolean(value.value) ? value.value : property.value.default,
);
</script>

<template>
  <MDCheckbox
    :model-value="convertedValue"
    :indeterminate="indeterminate"
    readonly
    :tab-index="-1"
    :tooltip="name"
    aria-hidden="true"
  />
</template>
