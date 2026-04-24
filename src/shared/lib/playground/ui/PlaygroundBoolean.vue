<script setup lang="ts">
const value = defineModel<boolean>({ required: true });

defineProps<{ label: string }>();
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="checkbox" />
  </label>
</template>
