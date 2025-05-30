import type { MaybeElementRef } from '@vueuse/core';
import {
  useElementBounding,
  useElementSize,
  useWindowSize,
} from '@vueuse/core';
import type { StyleValue } from 'vue';
import { computed } from 'vue';

export const setupTooltip = (
  targetElementRef: MaybeElementRef,
  tooltipEl: MaybeElementRef,
) => {
  const {
    x: targetX,
    y: targetY,
    width: targetWidth,
    height: targetHeight,
  } = useElementBounding(targetElementRef);

  const { width: tooltipWidth, height: tooltipHeight } =
    useElementSize(tooltipEl);

  // offset from target
  const padding = 8;
  // indent from window border
  const margin = 16;

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

  const hasSpaceRight = computed(
    () =>
      targetX.value +
        targetWidth.value +
        padding +
        tooltipWidth.value +
        margin <=
      0 + windowWidth.value,
  );

  const hasSpaceLeft = computed(
    () => targetX.value - tooltipWidth.value - margin - padding >= 0,
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

  return {
    tooltipStyle,
  };
};
