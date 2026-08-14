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

const convertedValue = computed(() =>
  isBoolean(value.value) ? value.value : property.value.default,
);

// `property.indeterminate` is a legacy capability flag that only permits the
// effective value to remain `undefined`; it is not the canonical MDCheckbox
// "currently rendered mixed state". Translate explicitly per ARCHITECTURE.md
// scenario 4 rather than forwarding the flag directly.
const checked = computed(() => convertedValue.value === true);

const indeterminate = computed(
  () => property.value.indeterminate === true && convertedValue.value === undefined,
);
</script>

<template>
  <span class="boolean-value-inline">
    <MDCheckbox presentation :checked="checked" :indeterminate="indeterminate" />

    <MDPlainTooltip :text="name" />
  </span>
</template>

<style scoped>
.boolean-value-inline {
  display: inline-flex;
  margin-inline: auto;
}
</style>
