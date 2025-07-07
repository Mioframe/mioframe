<script setup lang="ts">
defineProps<{ label: string }>();

const value = defineModel<string>({ required: true });
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="text" />
  </label>
</template>
