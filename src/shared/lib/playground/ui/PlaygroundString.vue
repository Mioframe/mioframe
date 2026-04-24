<script setup lang="ts">
const value = defineModel<string>({ required: true });

defineProps<{ label: string }>();
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="text" />
  </label>
</template>
