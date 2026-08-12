<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/material';
import { MDPlainTooltip } from '@shared/ui/Tooltips';
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
  <span class="boolean-value-inline">
    <MDCheckbox presentation :checked="convertedValue" :indeterminate="indeterminate" />

    <MDPlainTooltip :text="name" />
  </span>
</template>

<style scoped>
.boolean-value-inline {
  display: inline-flex;
  margin-inline: auto;
}
</style>
