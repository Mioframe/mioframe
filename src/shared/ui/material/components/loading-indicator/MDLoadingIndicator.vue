<script setup lang="ts">
import '@m3e/web/loading-indicator';
import { computed, onMounted, warn, watchEffect } from 'vue';

const props = withDefaults(
  defineProps<{
    /**
     * Accessible purpose of the ongoing process (Loading indicator accessibility:
     * "Write a label describing the purpose of the loading indicator, such as
     * loading news article or refreshing page").
     */
    label: string;
    /**
     * Active indicator size in Material dp, mapped 1:1 to CSS px. Accepted range is
     * 24 through 240 inclusive (Loading indicator overview/specs: the indicator "can
     * scale in size" between 24dp and 240dp); values outside that range are clamped
     * to the nearest bound. Defaults to the official Material default of 48.
     */
    size?: number;
  }>(),
  { size: 48 },
);

/** Accepted Material dp range (Loading indicator overview/specs: "can scale in size" 24dp-240dp). */
const MIN_SIZE = 24;
const MAX_SIZE = 240;
const DEFAULT_SIZE = 48;

const normalizedSize = computed(() =>
  Number.isFinite(props.size) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, props.size)) : DEFAULT_SIZE,
);

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (!Number.isFinite(props.size)) {
        warn(
          `MDLoadingIndicator: \`size\` must be a finite number; received ${props.size}. Normalized to ${DEFAULT_SIZE}.`,
        );
      } else if (props.size !== normalizedSize.value) {
        warn(
          `MDLoadingIndicator: \`size\` must be between ${MIN_SIZE} and ${MAX_SIZE}; received ${props.size}. Clamped to ${normalizedSize.value}.`,
        );
      }
    });
  });
}

const style = computed(() => ({ '--m3e-loading-indicator-size': `${normalizedSize.value}px` }));
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
