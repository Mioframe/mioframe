<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useProvidePaneContainer } from './useMDContainer';

defineSlots<{
  default: () => unknown;
}>();

const el = useTemplateRef('el');

useProvidePaneContainer(el);
</script>

<template>
  <div ref="el" class="md md-pane-container">
    <slot />
  </div>
</template>

<style lang="css" scoped>
.md-pane-container {
  flex-grow: 1;
  flex-shrink: 1;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: var(--md-pane-container-shape, 16px);
  overflow-y: auto;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);
}
</style>
