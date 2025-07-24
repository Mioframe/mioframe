<script setup lang="ts">
defineProps<{ label: string; step?: number; min?: number; max?: number }>();

const value = defineModel<number>({ required: true });
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="number" :step="step" :min="min" :max="max" />
  </label>
</template>
