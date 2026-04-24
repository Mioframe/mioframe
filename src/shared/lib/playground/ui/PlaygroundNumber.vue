<script setup lang="ts">
const value = defineModel<number>({ required: true });

defineProps<{ label: string; step?: number; min?: number; max?: number }>();
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="number" :step="step" :min="min" :max="max" />
  </label>
</template>
