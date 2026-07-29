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
     * Overall Loading indicator component size in Material dp, mapped 1:1 to CSS
     * px. Accepted range is 24 through 240 inclusive (Loading indicator
     * overview/specs: the indicator "can scale in size" between 24dp and 240dp);
     * values outside that range are clamped to the nearest bound. Defaults to the
     * official Material default of 48. The active-indicator area scales
     * proportionally within this overall size (specs: 38dp active indicator
     * within the 48dp default overall size).
     */
    size?: number;
  }>(),
  { size: 48 },
);

/** Accepted Material dp range (Loading indicator overview/specs: "can scale in size" 24dp-240dp). */
const MIN_SIZE = 24;
const MAX_SIZE = 240;
const DEFAULT_SIZE = 48;

/**
 * Official Material default active-indicator/overall ratio (38dp active indicator
 * within a 48dp overall/container size, Loading indicator specs). Preserved when
 * resizing so the public `size` keeps meaning the overall component size.
 */
const MATERIAL_ACTIVE_SIZE_RATIO = 38 / 48;

const normalizedSize = computed(() =>
  Number.isFinite(props.size) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, props.size)) : DEFAULT_SIZE,
);

const activeIndicatorSize = computed(() => normalizedSize.value * MATERIAL_ACTIVE_SIZE_RATIO);

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

/**
 * Explicit host width/height carry the public overall Material size (M3E-002:
 * the m3e uncontained host would otherwise derive its width from the same
 * private active-size input, collapsing the overall/active distinction). The
 * private input keeps the confirmed effective (documented-name-divergent,
 * M3E-001) m3e CSS variable, scaled to the official active-indicator ratio.
 * Both defects remain confirmed in the consumed 2.6.3 artifact (affected
 * range 2.6.2-2.6.3); see docs/m3e-defects.md.
 */
const style = computed(() => ({
  width: `${normalizedSize.value}px`,
  height: `${normalizedSize.value}px`,
  '--m3e-loading-indicator-size': `${activeIndicatorSize.value}px`,
}));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-undef-components -- m3e-loading-indicator is selected by config/vueCustomElements.ts. -->
  <m3e-loading-indicator class="md-loading-indicator" :aria-label="props.label" :style="style" />
</template>

<style scoped>
@import './tokens.css';

.md-loading-indicator {
  vertical-align: middle;
}
</style>
