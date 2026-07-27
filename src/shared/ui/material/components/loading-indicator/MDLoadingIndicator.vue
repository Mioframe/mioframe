<script setup lang="ts">
import '@m3e/web/loading-indicator';
import { computed } from 'vue';

const props = defineProps<{
  /**
   * Accessible purpose of the ongoing process (Loading indicator accessibility:
   * "Write a label describing the purpose of the loading indicator, such as
   * loading news article or refreshing page").
   */
  label: string;
  /**
   * Active indicator size as a CSS length (Loading indicator overview/guidelines:
   * the indicator "can scale in size" between 24dp and 240dp). Defaults to the
   * official Material default of 38dp.
   */
  size?: string | undefined;
}>();

const style = computed(() =>
  props.size ? { '--m3e-loading-indicator-size': props.size } : undefined,
);
</script>

<template>
  <m3e-loading-indicator class="md-loading-indicator" :aria-label="props.label" :style="style" />
</template>

<style scoped>
.md-loading-indicator {
  vertical-align: middle;
  /* Inherits the composing component's rendered color, matching the Loading
     indicator accessibility requirement to keep 3:1 contrast against the
     component it is placed in. */
  --m3e-loading-indicator-active-indicator-color: currentColor;
}
</style>
