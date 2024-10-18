<script setup lang="ts">
defineProps<{
  value: unknown;
}>();
</script>

<template>
  <label class="checkbox">
    <input type="checkbox" :checked="!!value" @click.prevent />
  </label>
</template>
