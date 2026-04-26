<script setup lang="ts">
import { setupPaneContext, type PaneContext } from './paneContext';
import { computed } from 'vue';

const props = defineProps<PaneContext>();

defineSlots<{
  default: () => unknown;
}>();

const paneContext = computed<PaneContext>(() => ({
  name: props.name,
  index: props.index,
}));

setupPaneContext(paneContext);
</script>

<template>
  <slot />
</template>
