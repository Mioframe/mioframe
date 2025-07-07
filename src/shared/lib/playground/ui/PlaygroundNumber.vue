<script setup lang="ts">
defineProps<{ label: string }>();

const value = defineModel<number>({ required: true });
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="number" />
  </label>
</template>
