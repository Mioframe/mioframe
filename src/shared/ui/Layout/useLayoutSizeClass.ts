import type { MaybeComputedElementRef } from '@vueuse/core';
import { useElementSize } from '@vueuse/core';
import { computed } from 'vue';

export enum LAYOUT_CLASS {
  compact = 'compact',
  medium = 'medium',
  expanded = 'expanded',
  large = 'large',
  extraLarge = 'extraLarge',
}

export const LAYOUT_MIN_WIDTH = {
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
};

export const useLayoutSizeClass = (target: MaybeComputedElementRef) => {
  const { width: layoutWidth } = useElementSize(target);

  const layoutClass = computed((): LAYOUT_CLASS => {
    if (layoutWidth.value < LAYOUT_MIN_WIDTH.medium) {
      return LAYOUT_CLASS.compact;
    }
    if (layoutWidth.value < LAYOUT_MIN_WIDTH.expanded) {
      return LAYOUT_CLASS.medium;
    }
    if (layoutWidth.value < LAYOUT_MIN_WIDTH.large) {
      return LAYOUT_CLASS.expanded;
    }
    if (layoutWidth.value < LAYOUT_MIN_WIDTH.extraLarge) {
      return LAYOUT_CLASS.large;
    }
    return LAYOUT_CLASS.extraLarge;
  });

  return {
    layoutClass,
    layoutWidth,
  };
};
