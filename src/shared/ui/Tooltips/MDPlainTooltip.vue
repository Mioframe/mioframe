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

<style lang="scss" scoped>
@use '../../lib/md';

.md-plain-tooltip {
  display: flex;
  justify-content: center;
  align-items: center;

  color: var(--md-sys-color-inverse-on-surface);
  background-color: var(--md-sys-color-inverse-surface);
  min-height: md.dp(24);
  padding-left: md.dp(8);
  padding-right: md.dp(8);
  border-radius: var(--md-sys-shape-corner-extra-small);

  font-family: var(--md-sys-typescale-body-small-font);
  line-height: var(--md-sys-typescale-body-small-line-height);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}
</style>
