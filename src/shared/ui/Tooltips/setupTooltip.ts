import type { MaybeElementRef } from '@vueuse/core';
import {
  useElementBounding,
  useElementSize,
  useWindowSize,
} from '@vueuse/core';
import { isNumber } from 'es-toolkit/compat';
import type { StyleValue } from 'vue';
import { computed } from 'vue';

export const setupTooltip = (
  targetElementRef: MaybeElementRef,
  tooltipEl: MaybeElementRef,
) => {
  // offset from target
  const padding = 8;
  // indent from window border
  const margin = 16;

  const {
    x: targetLeft,
    y: targetTop,
    width: targetWidth,
    height: targetHeight,
  } = useElementBounding(targetElementRef);

  const { width: tooltipWidth, height: tooltipHeight } = useElementSize(
    tooltipEl,
    undefined,
    { box: 'border-box' },
  );

  const { height: windowHeight, width: windowWidth } = useWindowSize();

  const topPositionY = computed(
    () => targetTop.value - padding - tooltipHeight.value,
  );

  const centerPositionY = computed(
    () => targetTop.value + targetHeight.value / 2 - tooltipHeight.value / 2,
  );

  const bottomPositionY = computed(
    () => targetTop.value + targetHeight.value + padding,
  );

  const leftPositionX = computed(
    () => targetLeft.value - padding - tooltipWidth.value,
  );

  const centerPositionX = computed(
    () => targetLeft.value + targetWidth.value / 2 - tooltipWidth.value / 2,
  );

  const rightPositionX = computed(
    () => targetLeft.value + targetWidth.value + padding,
  );

  const hasTopHeight = computed(() => topPositionY.value - margin >= 0);

  const hasBottomHeight = computed(
    () =>
      bottomPositionY.value + tooltipHeight.value + margin <=
      windowHeight.value,
  );

  const hasTopSpace = computed(
    () =>
      // check top side
      hasTopHeight.value &&
      // check right side
      targetLeft.value +
        targetWidth.value / 2 +
        tooltipWidth.value / 2 +
        margin <=
        windowWidth.value &&
      // check left side
      centerPositionX.value - margin >= 0,
  );

  const hasBottomSpace = computed(
    () =>
      // check bottom side
      hasBottomHeight.value &&
      // check right side
      targetLeft.value +
        targetWidth.value / 2 +
        tooltipWidth.value / 2 +
        margin <=
        windowWidth.value &&
      // check left side
      centerPositionX.value - margin >= 0,
  );

  const hasRightWidth = computed(
    () =>
      rightPositionX.value + tooltipWidth.value + margin <= windowWidth.value,
  );

  const hasRightSpace = computed(
    () =>
      // check right side
      hasRightWidth.value &&
      // check top side
      centerPositionY.value - margin >= 0 &&
      // check bottom side
      centerPositionY.value + tooltipHeight.value + margin <=
        windowHeight.value,
  );

  const hasLeftSpace = computed(
    () =>
      // check left side
      hasLeftWidth.value &&
      // check top side
      centerPositionY.value - margin >= 0 &&
      // check bottom side
      centerPositionY.value + tooltipHeight.value + margin <=
        windowHeight.value,
  );

  const hasLeftWidth = computed(() => leftPositionX.value - margin >= 0);

  const topLeftPosition = computed(() => ({
    y: topPositionY.value,
    x: leftPositionX.value,
  }));

  const topCenterPosition = computed(() => ({
    y: topPositionY.value,
    x: centerPositionX.value,
  }));

  const topRightPosition = computed(() => ({
    y: topPositionY.value,
    x: rightPositionX.value,
  }));

  const centerRightPosition = computed(() => ({
    y: centerPositionY.value,
    x: rightPositionX.value,
  }));

  const bottomRightPosition = computed(() => ({
    y: bottomPositionY.value,
    x: rightPositionX.value,
  }));

  const bottomCenterPosition = computed(() => ({
    y: bottomPositionY.value,
    x: centerPositionX.value,
  }));

  const bottomLeftPosition = computed(() => ({
    y: bottomPositionY.value,
    x: leftPositionX.value,
  }));

  const centerLeftPosition = computed(() => ({
    y: centerPositionY.value,
    x: leftPositionX.value,
  }));

  /**
   * preferred positioning for Plain Tooltip
   */
  const sidePosition = computed((): { x: number; y: number } | undefined => {
    if (hasTopSpace.value) {
      return topCenterPosition.value;
    }
    if (hasRightSpace.value) {
      return centerRightPosition.value;
    }
    if (hasBottomSpace.value) {
      return bottomCenterPosition.value;
    }
    if (hasLeftSpace.value) {
      return centerLeftPosition.value;
    }

    return undefined;
  });

  /**
   * preferred positioning for Rich Tooltip
   */
  const diagonalPosition = computed(() => {
    if (hasBottomHeight.value && hasRightWidth.value) {
      return bottomRightPosition.value;
    }
    if (hasBottomHeight.value && hasLeftWidth.value) {
      return bottomLeftPosition.value;
    }
    if (hasTopHeight.value && hasLeftWidth.value) {
      return topLeftPosition.value;
    }
    if (hasTopHeight.value && hasRightWidth.value) {
      return topRightPosition.value;
    }
    return undefined;
  });

  const partiallyAvailablePosition = computed(() => ({
    y: hasTopHeight.value
      ? topPositionY.value
      : hasBottomHeight.value
        ? bottomPositionY.value
        : undefined,
    x: hasRightWidth.value
      ? rightPositionX.value
      : hasLeftWidth.value
        ? leftPositionX.value
        : undefined,
  }));

  const toPx = (num: number) => `${num}px` as const;

  const coordinatesToPosition = ({ x, y }: { x?: number; y?: number }) => ({
    top: isNumber(y) ? toPx(y) : undefined,
    left: isNumber(x) ? toPx(x) : undefined,
  });

  const plainTooltipStyle = computed((): StyleValue => {
    if (sidePosition.value) {
      return coordinatesToPosition(sidePosition.value);
    }

    if (diagonalPosition.value) {
      return coordinatesToPosition(diagonalPosition.value);
    }

    return coordinatesToPosition(partiallyAvailablePosition.value);
  });

  const richTooltipStyle = computed((): StyleValue => {
    if (diagonalPosition.value) {
      return coordinatesToPosition(diagonalPosition.value);
    }

    if (sidePosition.value) {
      return coordinatesToPosition(sidePosition.value);
    }

    return coordinatesToPosition(partiallyAvailablePosition.value);
  });

  const targetCenterX = computed(
    () => targetLeft.value + targetWidth.value / 2,
  );
  const targetCenterY = computed(
    () => targetTop.value + targetHeight.value / 2,
  );

  const alignCenterPosition = computed(() => {
    const x = Math.min(
      Math.max(targetCenterX.value - tooltipWidth.value / 2, margin),
      windowWidth.value - tooltipWidth.value - margin,
    );
    const y = Math.min(
      Math.max(targetCenterY.value - tooltipHeight.value / 2, margin),
      windowHeight.value - tooltipHeight.value - margin,
    );

    return { x, y };
  });

  const alignCenterStyle = computed((): StyleValue => {
    return {
      ...coordinatesToPosition(alignCenterPosition.value),
      maxWidth: `calc(100vw - ${margin * 2}px)`,
      maxHeight: `calc(100vh - ${margin * 2}px)`,
    };
  });

  return {
    plainTooltipStyle,
    richTooltipStyle,
    alignCenterStyle,
  };
};
