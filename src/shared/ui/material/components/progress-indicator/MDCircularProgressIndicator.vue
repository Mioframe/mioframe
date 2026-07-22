<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';

const props = withDefaults(
  defineProps<{
    /**
     * Determinate value in the 0-1 range. Omit (or pass `undefined`) for the indeterminate
     * (spinning) visual — `0` is a valid determinate value (an empty ring), distinct from
     * indeterminate.
     */
    progress?: number | undefined;
    /** Rendered diameter in CSS pixels. Defaults to `40`, matching `md.comp.progress-indicator.circular.size`. */
    size?: number | undefined;
    /**
     * Accessible name. When provided, the indicator exposes `role="progressbar"` with
     * `aria-valuemin`/`aria-valuemax` (and `aria-valuenow` when determinate). When omitted, the
     * indicator is `aria-hidden` — the correct default for every current use as a decorative
     * loading replacement inside an already-labeled surface (a button, list item, or dialog).
     */
    label?: string | undefined;
  }>(),
  {
    progress: undefined,
    size: 40,
    label: undefined,
  },
);

const { progress, size, label } = toRefs(props);

const isIndeterminate = computed(() => progress.value === undefined);
const determinateProgress = computed(() => progress.value ?? 0);

const width = ref(4);
const radius = computed(() => (size.value - width.value) / 2);
const center = computed(() => radius.value + width.value / 2);
const viewBox = computed(() => `0 0 ${2 * center.value} ${2 * center.value}`);

const perimeter = computed(() => {
  return 2 * Math.PI * radius.value;
});

const strokeLinecap = computed<'butt' | 'round' | 'square' | 'inherit' | undefined>(() =>
  determinateProgress.value === 1 ? undefined : 'round',
);

const gap = computed(() => (Number.isInteger(determinateProgress.value) ? 0 : width.value * 2));

const progressLineLength = computed(() => {
  return perimeter.value * determinateProgress.value - gap.value;
});

const progressLineOffset = computed(() => {
  return -gap.value / 2 + perimeter.value / 4;
});

const progressDasharray = computed(() => {
  return `${progressLineLength.value} ${perimeter.value - progressLineLength.value}`;
});

const minIndeterminateDasharray = computed(
  () => `${perimeter.value * 0.1} ${perimeter.value * 0.9}`,
);
const maxIndeterminateDasharray = computed(
  () => `${perimeter.value * 0.9} ${perimeter.value * 0.1}`,
);

const animateValue = computed(
  () =>
    `${minIndeterminateDasharray.value};${maxIndeterminateDasharray.value};${minIndeterminateDasharray.value}`,
);

const ariaValueNow = computed(() =>
  isIndeterminate.value ? undefined : Math.round(determinateProgress.value * 100),
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    class="md md-circular-progress-indicator"
    :role="label ? 'progressbar' : undefined"
    :aria-label="label"
    :aria-valuemin="label ? 0 : undefined"
    :aria-valuemax="label ? 100 : undefined"
    :aria-valuenow="label ? ariaValueNow : undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <circle
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="width"
      class="md-circular-progress-indicator__track"
    />

    <circle
      v-if="isIndeterminate || progressLineLength > 0"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="width"
      :stroke-linecap="strokeLinecap"
      :stroke-dasharray="isIndeterminate ? minIndeterminateDasharray : progressDasharray"
      :stroke-dashoffset="progressLineOffset"
      class="md-circular-progress-indicator__progress"
    >
      <animate
        v-if="isIndeterminate"
        attributeName="stroke-dasharray"
        :values="animateValue"
        dur="4s"
        repeatCount="indefinite"
      />
    </circle>

    <animateTransform
      v-if="isIndeterminate"
      attributeName="transform"
      type="rotate"
      from="0"
      to="360"
      dur=".7s"
      repeatCount="indefinite"
    />
  </svg>
</template>

<style lang="css" scoped src="./progress-indicator.tokens.css"></style>
<style lang="css" scoped>
.md-circular-progress-indicator {
  --md-private-progress-indicator-track-color: var(--md-comp-progress-indicator-track-color);
  --md-circular-progress-color: var(--md-comp-progress-indicator-active-indicator-color);
  display: inline-block;
  background-color: transparent;

  &__track {
    stroke: var(--md-private-progress-indicator-track-color);
  }

  &__progress {
    stroke: var(--md-circular-progress-color);
  }
}
</style>
