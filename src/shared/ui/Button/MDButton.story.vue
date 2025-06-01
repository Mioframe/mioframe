<script setup lang="ts">
import { ref } from 'vue';
import MDButton from './MDButton.vue';
import type { ArrayValues } from 'type-fest';

const colorOptions = [
  { label: 'undefined', value: undefined },
  { label: 'text', value: 'text' },
  { label: 'elevated', value: 'elevated' },
  { label: 'filled', value: 'filled' },
  { label: 'tonal', value: 'tonal' },
  { label: 'outlined', value: 'outlined' },
] as const;
const typeOptions = [
  { label: 'undefined', value: undefined },
  { label: 'default', value: 'default' },
  { label: 'toggle', value: 'toggle' },
] as const;
const sizeOptions = [
  { label: 'undefined', value: undefined },
  { label: 'extra-small', value: 'extra-small' },
  { label: 'small', value: 'small' },
  { label: 'medium', value: 'medium' },
  { label: 'large', value: 'large' },
  { label: 'extra-large', value: 'extra-large' },
] as const;
const shapeOptions = [
  { label: 'undefined', value: undefined },
  { label: 'round', value: 'round' },
  { label: 'square', value: 'square' },
] as const;

const color = ref<ArrayValues<typeof colorOptions>['value']>();
const type = ref<ArrayValues<typeof typeOptions>['value']>();
const size = ref<ArrayValues<typeof sizeOptions>['value']>();
const shape = ref<ArrayValues<typeof shapeOptions>['value']>();
</script>

<template>
  <Story title="Buttons/Buttons">
    <template #controls>
      <HstSelect v-model="color" :options="colorOptions" title="color" />

      <HstSelect v-model="type" :options="typeOptions" title="type" />

      <HstSelect v-model="size" :options="sizeOptions" title="size" />

      <HstSelect v-model="shape" :options="shapeOptions" title="shape" />
    </template>

    <MDButton label="Label" :color :type :shape :size />
  </Story>
</template>

<docs lang="md">
# Buttons

Buttons prompt most actions in a UI

Соответствует Buttons - [Material Design 3](https://m3.material.io/components/buttons/overview)
</docs>
