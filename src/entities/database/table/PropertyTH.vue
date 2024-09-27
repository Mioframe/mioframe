<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <th>
    {{ name }}
  </th>
</template>
