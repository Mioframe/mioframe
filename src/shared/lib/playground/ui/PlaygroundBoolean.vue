<script setup lang="ts">
defineProps<{ label: string }>();

const value = defineModel<boolean>({ required: true });
</script>

<template>
  <label>
    {{ label }}
    <input v-model="value" type="checkbox" />
  </label>
</template>
