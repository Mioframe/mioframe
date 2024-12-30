<script setup lang="ts">
import MDPlainTooltip from './MDPlainTooltip.vue';
</script>

<template>
  <div class="grid">
    <MDPlainTooltip text="Plain tooltip" />
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px;
  justify-content: center;
  align-items: center;
}
</style>
