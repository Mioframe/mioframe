<script setup lang="ts">
import { setupPaneContext, type PaneContext } from './paneContext';

const props = defineProps<PaneContext>();

defineSlots<{
  default: () => unknown;
}>();

setupPaneContext(props);
</script>

<template>
  <slot />
</template>
