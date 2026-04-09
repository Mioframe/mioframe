<script setup lang="ts" generic="O extends Array<unknown> | ReadonlyArray<unknown>">
import type { ValueOf } from 'type-fest';

defineProps<{ label: string; options: O }>();

const value = defineModel<ValueOf<O>>({ required: true });
</script>

<template>
  <label>
    {{ label }}
    <select v-model="value">
      <option v-for="(option, i) in options" :key="i" :value="option">
        {{ String(option) }}
      </option>
    </select>
  </label>
</template>
