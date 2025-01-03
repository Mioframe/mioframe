<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <div class="md-plain-tooltip">
    {{ text }}
  </div>
</template>

<style scoped>
.md-plain-tooltip {
  display: flex;
  justify-content: center;
  align-items: center;

  color: var(--md-sys-color-inverse-on-surface);
  background-color: var(--md-sys-color-inverse-surface);
  min-height: 24px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: var(--md-sys-shape-corner-extra-small);

  font-family: var(--md-sys-typescale-body-small-font);
  line-height: var(--md-sys-typescale-body-small-line-height);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}
</style>
