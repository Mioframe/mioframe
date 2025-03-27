<script setup lang="ts">
const { fullWidth } = defineProps<{
  fullWidth?: boolean;
}>();
</script>

<template>
  <hr
    class="md-divider"
    :class="{
      'md-divider_full': fullWidth,
    }"
  />
</template>

<style lang="css" scoped>
.md-divider {
  display: block;
  width: calc(100% - 32px);
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
  border: 0 solid var(--md-container-color);
  border-left-width: 16px;
  border-right-width: 16px;

  &_full {
    border: 0;
    width: 100%;
  }
}
</style>
