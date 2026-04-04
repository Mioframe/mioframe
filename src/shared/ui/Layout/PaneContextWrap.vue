<script setup lang="ts">
import { setupPaneContext, type PaneContext } from './paneContext';

// eslint-disable-next-line vue/no-unused-properties -- used for setupPaneContext
const props = defineProps<PaneContext>();

defineSlots<{
  default: () => unknown;
}>();

setupPaneContext(props);
</script>

<template>
  <slot />
</template>
