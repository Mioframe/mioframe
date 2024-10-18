<script setup lang="ts">
defineProps<{
  value: unknown;
}>();
</script>

<template>
  <span>{{ value ?? 'undefined' }}</span>
</template>
