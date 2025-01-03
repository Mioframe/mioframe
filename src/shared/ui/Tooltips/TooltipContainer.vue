<script setup lang="ts">
import type { MaybeElement } from '@vueuse/core';
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { useTooltip } from './directiveTooltip';
import MDPlainTooltip from './MDPlainTooltip.vue';
import type { StyleValue } from 'vue';
import { computed, ref, toRef, toRefs } from 'vue';
import { FadeTransition } from '@noction/vue-bezier';

const { tooltipState } = toRefs(useTooltip());

const tooltipEl = ref<MaybeElement>();

const targetElement = toRef(() => tooltipState.value.targetElement);

// offset from target
const padding = 8;
// indent from window border
const margin = 16;

const {
  x: targetX,
  y: targetY,
  width: targetWidth,
  height: targetHeight,
} = useElementBounding(targetElement);

const { width: tooltipWidth, height: tooltipHeight } =
  useElementBounding(tooltipEl);

const { height: windowHeight, width: windowWidth } = useWindowSize();

const hasSpaceAbove = computed(
  () =>
    targetY.value - tooltipHeight.value - margin - padding >= 0 &&
    targetX.value + targetWidth.value / 2 + tooltipWidth.value / 2 + margin <=
      windowWidth.value &&
    targetX.value + targetWidth.value / 2 - tooltipWidth.value / 2 - margin >=
      0,
);

const hasSpaceBelow = computed(
  () =>
    targetY.value +
      targetHeight.value +
      padding +
      tooltipHeight.value +
      margin <=
      windowHeight.value &&
    targetX.value + targetWidth.value / 2 + tooltipWidth.value / 2 + margin <=
      windowWidth.value &&
    targetX.value + targetWidth.value / 2 - tooltipWidth.value / 2 - margin >=
      0,
);

const hasSpaceLeft = computed(
  () => targetX.value - tooltipWidth.value - margin - padding >= 0,
);

const hasSpaceRight = computed(
  () =>
    targetX.value + targetWidth.value + padding + tooltipWidth.value + margin <=
    0 + windowWidth.value,
);

const tooltipPosition = computed((): { x: number; y: number } => {
  if (hasSpaceAbove.value) {
    return {
      y: targetY.value - tooltipHeight.value - padding,
      x: targetX.value + targetWidth.value / 2 - tooltipWidth.value / 2,
    };
  } else if (hasSpaceBelow.value) {
    return {
      y: targetY.value + targetHeight.value + padding,
      x: targetX.value + targetWidth.value / 2 - tooltipWidth.value / 2,
    };
  } else if (hasSpaceRight.value) {
    return {
      y: targetY.value + targetHeight.value / 2 - tooltipHeight.value / 2,
      x: targetX.value + targetWidth.value + padding,
    };
  } else if (hasSpaceLeft.value) {
    return {
      y: targetY.value + targetHeight.value / 2 - tooltipHeight.value / 2,
      x: targetX.value - padding - tooltipWidth.value,
    };
  }

  return { x: 0, y: 0 };
});

const tooltipStyle = computed(
  (): StyleValue => ({
    top: `${tooltipPosition.value.y}px`,
    left: `${tooltipPosition.value.x}px`,
  }),
);
</script>

<template>
  <div class="tooltip-container">
    <FadeTransition>
      <MDPlainTooltip
        v-if="tooltipState.text"
        ref="tooltipEl"
        class="tooltip-container__tooltip"
        :text="tooltipState.text"
        :style="tooltipStyle"
      />
    </FadeTransition>
  </div>
</template>

<style scoped>
.tooltip-container {
  &__tooltip {
    position: fixed;
  }
}
</style>
