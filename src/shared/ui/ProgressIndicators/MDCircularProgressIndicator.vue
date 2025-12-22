<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';

const props = withDefaults(
  defineProps<{
    progress?: number;
    size?: number;
  }>(),
  {
    progress: 0,
    size: 40,
  },
);

const { progress, size } = toRefs(props);

const width = ref(4);
const radius = computed(() => (size.value - width.value) / 2);
const center = computed(() => radius.value + width.value / 2);
const viewBox = computed(() => `0 0 ${2 * center.value} ${2 * center.value}`);

const perimeter = computed(() => {
  return 2 * Math.PI * radius.value;
});

const strokeLinecap = computed<
  'butt' | 'round' | 'square' | 'inherit' | undefined
>(() => (progress.value === 1 ? undefined : 'round'));

const gap = computed(() => (Number.isInteger(progress) ? 0 : width.value * 2));

const progressLineLength = computed(() => {
  return perimeter.value * progress.value - gap.value;
});

const progressGapLength = computed(
  () => perimeter.value * (1 - progress.value) + gap.value,
);

const progressDasharray = computed(() => {
  return `${progressLineLength.value} ${progressGapLength.value}`;
});

const progressLineOffset = computed(() => {
  return -gap.value / 2 + perimeter.value / 4;
});

const emptyLineLength = computed(
  () => perimeter.value * (1 - progress.value) - gap.value,
);

const emptyGapLength = computed(
  () => perimeter.value * progress.value + gap.value,
);

const emptyDasharray = computed(() => {
  return `${emptyLineLength.value} ${emptyGapLength.value}`;
});

const emptyLineOffset = computed(() => {
  return (
    -perimeter.value * progress.value - gap.value / 2 + perimeter.value / 4
  );
});

const minIndeterminateDasharray = computed(
  () =>
    `${perimeter.value * 0.1 - gap.value} ${perimeter.value * 0.9 + gap.value}`,
);
const maxIndeterminateDasharray = computed(
  () =>
    `${perimeter.value * 0.9 - gap.value} ${perimeter.value * 0.1 + gap.value}`,
);

const animateValue = computed(
  () =>
    `${minIndeterminateDasharray.value};${maxIndeterminateDasharray.value};${minIndeterminateDasharray.value}`,
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    class="md md-circular-progress-indicator"
  >
    <circle
      v-if="emptyLineLength > 0 && progress"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="width"
      :stroke-linecap="strokeLinecap"
      :stroke-dasharray="emptyDasharray"
      :stroke-dashoffset="emptyLineOffset"
      class="md-circular-progress-indicator__empty"
    />

    <circle
      v-if="progressLineLength > 0 || !progress"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      stroke="blue"
      :stroke-width="width"
      :stroke-linecap="strokeLinecap"
      :stroke-dasharray="progressDasharray"
      :stroke-dashoffset="progressLineOffset"
      class="md-circular-progress-indicator__progress"
    >
      <animate
        v-if="!progress"
        attributeName="stroke-dasharray"
        :values="animateValue"
        dur="4s"
        repeatCount="indefinite"
      />
    </circle>

    <animateTransform
      v-if="!progress"
      attributeName="transform"
      type="rotate"
      from="0"
      to="360"
      dur=".7s"
      repeatCount="indefinite"
    />
  </svg>
</template>

<style lang="css" scoped>
.md-circular-progress-indicator {
  --md-container-color: transparent;
  display: inline-block;

  &__empty {
    stroke: var(--md-container-color);
  }

  &__progress {
    stroke: var(--md-content-color);
  }
}
</style>
